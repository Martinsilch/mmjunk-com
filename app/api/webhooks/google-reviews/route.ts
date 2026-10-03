import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { fetchGoogleReview } from '@/lib/google-business';
import { resolveMunicipality, generateJobSlug, extractFirstName } from '@/lib/job-utils';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';

export async function POST(req: Request) {
  try {
    // 1. Validate Secret Query Parameter or Header
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const headerToken = req.headers.get('x-goog-pubsub-token');
    const expectedToken = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;

    if (expectedToken && token !== expectedToken && headerToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized push token' }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 2. Pub/Sub Message Envelope Check
    if (!body?.message?.data) {
      return NextResponse.json({ error: 'Invalid Pub/Sub envelope' }, { status: 400 });
    }

    // Decode Pub/Sub notification
    const decodedRaw = Buffer.from(body.message.data, 'base64').toString('utf8');
    let notification: any;
    try {
      notification = JSON.parse(decodedRaw);
    } catch {
      return NextResponse.json({ error: 'Failed to parse JSON inside Pub/Sub data' }, { status: 400 });
    }

    // Filter notification event
    if (notification.eventType !== 'NEW_REVIEW' && notification.eventType !== 'UPDATED_REVIEW') {
      return NextResponse.json({ message: 'Ignored non-review event' }, { status: 200 });
    }

    // Google sends resource name: "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
    const reviewResourceName = notification.resourceName || notification.reviewName;
    if (!reviewResourceName) {
      return NextResponse.json({ error: 'Missing review resource name' }, { status: 400 });
    }

    // 3. Fetch Full Review Details
    const reviewData = await fetchGoogleReview(reviewResourceName);
    if (!reviewData) {
      return NextResponse.json({ error: 'Failed to fetch review from Google API' }, { status: 502 });
    }

    const { reviewerName, starRating, comment, createTime, reviewId, ownerReply, ownerReplyDate, photos } = reviewData;
    const reviewFirstName = extractFirstName(reviewerName);

    // 4. Match & Merge Engine
    // Look back 3 days for a job matching customer first name
    const reviewDate = createTime ? new Date(createTime) : new Date();
    const windowStart = new Date(reviewDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(reviewDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    const inferredCity = resolveMunicipality(comment) || 'Federal Way';
    const targetSpokeSlug = inferredCity.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const candidates = await db.jobStory.findMany({
      where: {
        completedAt: { gte: windowStart, lte: windowEnd },
      },
      include: { location: true },
      orderBy: { completedAt: 'desc' },
    });

    // Prioritize candidates awaiting review (customerReview === null)
    const candidateJob = candidates.find(c => {
      const candidateFirst = extractFirstName(c.reviewerName);
      return candidateFirst && reviewFirstName && candidateFirst === reviewFirstName && c.customerReview === null;
    }) || candidates.find(c => {
      const candidateFirst = extractFirstName(c.reviewerName);
      return candidateFirst && reviewFirstName && candidateFirst === reviewFirstName;
    });

    let mergedJobId: string | null = null;
    let targetLocationSlug = targetSpokeSlug;
    let jobSlugToInvalidate: string | null = null;

    const incomingPhotos = photos || [];

    if (candidateJob) {
      // Direct Match: Merge review into existing Amzy telemetry record
      const updatedMedia = Array.from(new Set([...candidateJob.mediaUrls, ...incomingPhotos]));
      const updated = await db.jobStory.update({
        where: { id: candidateJob.id },
        data: {
          customerReview: comment,
          reviewRating: starRating,
          reviewSource: 'google',
          reviewPlatform: 'Google',
          reviewerName: reviewerName,
          ownerReply: ownerReply || candidateJob.ownerReply,
          ownerReplyDate: ownerReplyDate ? new Date(ownerReplyDate) : candidateJob.ownerReplyDate,
          mediaUrls: updatedMedia,
        },
      });

      mergedJobId = updated.id;
      targetLocationSlug = candidateJob.location.slug;
      jobSlugToInvalidate = updated.slug;
      if (updated.slug) {
        revalidateTag(`job-${updated.slug}`);
        revalidatePath(`/jobs/${updated.slug}`);
      }
    } else {
      // No Direct Amzy Match: Infer city from review text or fallback to Federal Way
      const meta = AUTHORIZED_MUNICIPALITIES[targetSpokeSlug];
      const cityName = meta ? meta.cityName : inferredCity;
      const county = meta ? meta.county : 'King County';
      const zipCodes = meta ? meta.zipCodes : ['98003'];
      const coordinates = meta ? meta.coords : [47.3223, -122.3126];
      const wikidataUri = meta ? meta.wikidataUri : 'https://www.wikidata.org/wiki/Q852586';

      const location = await db.locationSpoke.upsert({
        where: { slug: targetLocationSlug },
        update: {},
        create: {
          slug: targetLocationSlug,
          cityName,
          county,
          zipCodes,
          coordinates,
          wikidataUri,
        },
      });

      const fallbackSlug = generateJobSlug('Junk Removal', 'Verified Pickup', targetLocationSlug, reviewId);
      jobSlugToInvalidate = fallbackSlug;

      const existingJobWithSlug = await db.jobStory.findUnique({
        where: { slug: fallbackSlug }
      });

      let standaloneJob;
      if (existingJobWithSlug) {
        const updatedMedia = Array.from(new Set([...existingJobWithSlug.mediaUrls, ...incomingPhotos]));
        standaloneJob = await db.jobStory.update({
          where: { id: existingJobWithSlug.id },
          data: {
            customerReview: comment,
            reviewRating: starRating,
            reviewSource: 'google',
            reviewPlatform: 'Google',
            reviewerName: reviewerName,
            ownerReply: ownerReply || existingJobWithSlug.ownerReply,
            ownerReplyDate: ownerReplyDate ? new Date(ownerReplyDate) : existingJobWithSlug.ownerReplyDate,
            mediaUrls: updatedMedia,
          }
        });
      } else {
        standaloneJob = await db.jobStory.create({
          data: {
            locationId: location.id,
            slug: fallbackSlug,
            serviceType: 'Junk Removal & Hauling',
            itemCategory: 'Customer Pickup & Recycling',
            customerReview: comment,
            reviewRating: starRating,
            reviewSource: 'google',
            reviewPlatform: 'Google',
            reviewerName: reviewerName,
            ownerReply: ownerReply || null,
            ownerReplyDate: ownerReplyDate ? new Date(ownerReplyDate) : null,
            mediaUrls: incomingPhotos,
            completedAt: reviewDate,
          },
        });
      }

      mergedJobId = standaloneJob.id;
      revalidateTag(`job-${fallbackSlug}`);
      revalidatePath(`/jobs/${fallbackSlug}`);
    }

    // 5. Invalidate Edge Caches
    revalidateTag(`location-${targetLocationSlug}`);
    revalidateTag(`location-junk-removal-${targetLocationSlug}-wa`);
    revalidateTag('llms-manifest');
    revalidateTag('root-sitemap');

    revalidatePath(`/junk-removal-${targetLocationSlug}-wa`);
    revalidatePath('/jobs');
    revalidatePath('/llms.txt');
    revalidatePath('/sitemap.xml');

    return NextResponse.json({
      success: true,
      action: candidateJob ? 'MERGED_WITH_AMZY_JOB' : 'CREATED_NEW_STANDALONE_REVIEW',
      jobId: mergedJobId,
      location: targetLocationSlug,
      jobSlug: jobSlugToInvalidate,
    });
  } catch (error) {
    console.error('[Google PubSub Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal pipeline error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/webhooks/google-reviews',
    accepts: ['POST'],
    supportedEvents: ['NEW_REVIEW', 'UPDATED_REVIEW'],
  });
}
