import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { fetchYelpReviews } from '@/lib/yelp';
import { resolveMunicipality, generateJobSlug, extractFirstName } from '@/lib/job-utils';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';

const YelpPayloadSchema = z.object({
  reviewId: z.string().optional(),
  id: z.string().optional(),
  rating: z.union([z.number(), z.string().transform(Number)]).optional().default(5),
  text: z.string().optional(),
  comment: z.string().optional(),
  reviewerName: z.string().optional(),
  name: z.string().optional(),
  url: z.string().optional(),
  timeCreated: z.string().optional(),
  time_created: z.string().optional(),
  event: z.string().optional(),
  businessAlias: z.string().optional(),
  user: z.object({
    name: z.string().optional(),
    profile_url: z.string().optional()
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token');
    const authHeader = req.headers.get('authorization');
    const secretHeader = req.headers.get('x-webhook-secret') || req.headers.get('x-yelp-secret');
    const expectedSecret = process.env.YELP_WEBHOOK_SECRET;

    if (expectedSecret) {
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const provided = bearerToken || secretHeader || queryToken;
      if (!provided || provided !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: invalid or missing Yelp webhook secret' },
          { status: 401 }
        );
      }
    }

    // 2. Parse & Validate Payload
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = YelpPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const p = parsed.data;

    // Support trigger for full Yelp review sync
    let reviewsToProcess: Array<{
      reviewId: string;
      reviewerName: string;
      starRating: number;
      comment: string;
      timeCreated: string;
      url: string;
    }> = [];

    if (p.event === 'SYNC_REVIEWS' || (!p.text && !p.comment && !p.reviewId)) {
      const fetched = await fetchYelpReviews(p.businessAlias);
      reviewsToProcess = fetched;
    } else {
      const reviewId = p.reviewId || p.id || `yelp-${Date.now()}`;
      const reviewerName = p.reviewerName || p.user?.name || p.name || 'Verified Yelp Reviewer';
      const comment = p.text || p.comment || '';
      const starRating = Number(p.rating) || 5;
      const timeCreated = p.timeCreated || p.time_created || new Date().toISOString();
      const reviewUrl = p.url || `https://www.yelp.com/biz/${process.env.YELP_BUSINESS_ALIAS || 'm-and-m-junk-removal-federal-way-3'}`;

      reviewsToProcess = [{
        reviewId,
        reviewerName,
        starRating,
        comment,
        timeCreated,
        url: reviewUrl
      }];
    }

    const results = [];

    for (const r of reviewsToProcess) {
      const reviewFirstName = extractFirstName(r.reviewerName);
      const reviewDate = r.timeCreated ? new Date(r.timeCreated) : new Date();
      const windowStart = new Date(reviewDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      const windowEnd = new Date(reviewDate.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Infer city from review text or fallback to Federal Way
      const inferredCity = resolveMunicipality(r.comment) || 'Federal Way';
      const targetSpokeSlug = inferredCity.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Check candidates in 3-day rolling window
      const candidates = await db.jobStory.findMany({
        where: {
          completedAt: { gte: windowStart, lte: windowEnd },
        },
        include: { location: true },
        orderBy: { completedAt: 'desc' },
      });

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
      let action = 'CREATED_NEW_STANDALONE_YELP_REVIEW';

      if (candidateJob) {
        // Direct Match: Merge Yelp review into existing Amzy telemetry record
        const updated = await db.jobStory.update({
          where: { id: candidateJob.id },
          data: {
            customerReview: r.comment,
            reviewRating: r.starRating,
            reviewSource: 'yelp',
            reviewPlatform: 'Yelp',
            reviewUrl: r.url,
            reviewerName: r.reviewerName,
          },
        });

        mergedJobId = updated.id;
        targetLocationSlug = candidateJob.location.slug;
        jobSlugToInvalidate = updated.slug;
        action = 'MERGED_WITH_AMZY_JOB';

        if (updated.slug) {
          revalidateTag(`job-${updated.slug}`);
          revalidatePath(`/jobs/${updated.slug}`);
        }
      } else {
        // Standalone Yelp Review: Upsert spoke and create JobStory
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

        const fallbackSlug = generateJobSlug('Junk Removal', 'Verified Pickup', targetLocationSlug, r.reviewId);
        jobSlugToInvalidate = fallbackSlug;

        const existingJobWithSlug = await db.jobStory.findUnique({
          where: { slug: fallbackSlug }
        });

        let standaloneJob;
        if (existingJobWithSlug) {
          standaloneJob = await db.jobStory.update({
            where: { id: existingJobWithSlug.id },
            data: {
              customerReview: r.comment,
              reviewRating: r.starRating,
              reviewSource: 'yelp',
              reviewPlatform: 'Yelp',
              reviewUrl: r.url,
              reviewerName: r.reviewerName,
            }
          });
          action = 'UPDATED_EXISTING_YELP_REVIEW';
        } else {
          standaloneJob = await db.jobStory.create({
            data: {
              locationId: location.id,
              slug: fallbackSlug,
              serviceType: 'Junk Removal & Hauling',
              itemCategory: 'Customer Pickup & Recycling',
              customerReview: r.comment,
              reviewRating: r.starRating,
              reviewSource: 'yelp',
              reviewPlatform: 'Yelp',
              reviewUrl: r.url,
              reviewerName: r.reviewerName,
              completedAt: reviewDate,
            },
          });
          action = 'CREATED_NEW_STANDALONE_YELP_REVIEW';
        }

        mergedJobId = standaloneJob.id;
        revalidateTag(`job-${fallbackSlug}`);
        revalidatePath(`/jobs/${fallbackSlug}`);
      }

      // Invalidate Edge Caches
      const tagsToInvalidate = [
        `location-${targetLocationSlug}`,
        `location-junk-removal-${targetLocationSlug}-wa`,
        'llms-manifest',
        'root-sitemap'
      ];

      for (const tag of tagsToInvalidate) {
        try {
          revalidateTag(tag);
        } catch (err) {
          console.warn(`Tag invalidation warning:`, err);
        }
      }

      try {
        revalidatePath(`/junk-removal-${targetLocationSlug}-wa`);
        revalidatePath('/jobs');
        revalidatePath('/llms.txt');
        revalidatePath('/sitemap.xml');
      } catch (err) {
        console.warn('Path invalidation warning:', err);
      }

      results.push({
        reviewId: r.reviewId,
        action,
        jobId: mergedJobId,
        canonicalSlug: jobSlugToInvalidate,
        canonicalUrl: `/jobs/${jobSlugToInvalidate}`,
        location: targetLocationSlug
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      reviews: results
    });
  } catch (error) {
    console.error('[Yelp Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal Yelp ingestion error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const triggerSync = url.searchParams.get('sync') === 'true';

  if (triggerSync) {
    const reviews = await fetchYelpReviews();
    return NextResponse.json({
      status: 'ONLINE',
      endpoint: '/api/webhooks/yelp',
      syncResult: reviews
    });
  }

  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/webhooks/yelp',
    accepts: ['POST', 'GET'],
    supportedAuth: ['Bearer <YELP_WEBHOOK_SECRET>', 'x-webhook-secret', '?token=<SECRET>'],
    businessAlias: process.env.YELP_BUSINESS_ALIAS || 'm-and-m-junk-removal-federal-way-3'
  });
}
