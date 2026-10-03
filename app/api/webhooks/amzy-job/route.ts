import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { resolveMunicipality } from '@/lib/geo-resolver';
import { generateJobSlug, extractFirstName, serviceMatches, sanitizeReviewText } from '@/lib/job-utils';
import { recordReviewMetric } from '@/lib/reputation';

const AmzyCustomerSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
});

const AmzyTelemetrySchema = z.object({
  service: z.string().optional(),
  item: z.string().optional(),
  weightLbs: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  equipment: z.string().optional(),
  disposalFacility: z.string().optional(),
  dumpReceiptNumber: z.string().optional(),
  photos: z.array(z.string()).optional().default([]),
});

const AmzyJobPayloadSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  completedAt: z.string().optional(),
  customer: AmzyCustomerSchema.optional(),
  telemetry: AmzyTelemetrySchema.optional(),
  // Flat fallback fields
  city: z.string().optional(),
  zip: z.string().optional(),
  service: z.string().optional(),
  serviceType: z.string().optional(),
  item: z.string().optional(),
  itemCategory: z.string().optional(),
  weightLbs: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  equipment: z.string().optional(),
  equipmentUsed: z.string().optional(),
  disposalFacility: z.string().optional(),
  disposalSite: z.string().optional(),
  dumpReceiptNumber: z.string().optional(),
  disposalReceipt: z.string().optional(),
  photos: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  customerReview: z.string().optional(),
  review: z.string().optional(),
  comment: z.string().optional(),
  reviewRating: z.union([z.number(), z.string().transform(Number)]).optional(),
  rating: z.union([z.number(), z.string().transform(Number)]).optional(),
  reviewerName: z.string().optional(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Authenticate Request
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-webhook-secret') || req.headers.get('x-amzy-secret');
  const expectedSecret = process.env.DISPATCH_WEBHOOK_SECRET || process.env.AMZY_WEBHOOK_SECRET;

  if (expectedSecret) {
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const provided = bearerToken || secretHeader || queryToken;
    if (!provided || provided !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid or missing webhook secret token' },
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

  const parsed = AmzyJobPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const p = parsed.data;

  // 3. Extract & Normalize Fields
  const externalJobId = p.jobId;
  const customerName = p.customer?.name || p.reviewerName || p.name || 'Verified Client';
  const cityRaw = p.customer?.city || p.city || 'Federal Way';
  const zipRaw = p.customer?.zip || p.zip || '';
  const serviceType = p.telemetry?.service || p.service || p.serviceType || 'Commercial Appliance Removal';
  const itemCategory = p.telemetry?.item || p.item || p.itemCategory || 'Commercial Equipment';
  const weightLbs = p.telemetry?.weightLbs ?? p.weightLbs ?? null;
  const equipmentUsed = p.telemetry?.equipment || p.equipment || p.equipmentUsed || '16-ft Box Truck with Hydraulic Liftgate';
  const disposalSite = p.telemetry?.disposalFacility || p.disposalFacility || p.disposalSite || 'Regional Certified Transfer Station';
  const disposalReceipt = p.telemetry?.dumpReceiptNumber || p.dumpReceiptNumber || p.disposalReceipt || null;
  const mediaUrls = p.telemetry?.photos || p.photos || p.mediaUrls || [];
  const rawReview = p.customerReview || p.review || p.comment || null;
  const customerReview = rawReview ? sanitizeReviewText(rawReview) : null;
  const reviewRating = p.reviewRating ?? p.rating ?? (customerReview ? 5 : null);
  const completedAt = p.completedAt ? new Date(p.completedAt) : new Date();

  // 4. Resolve Municipality & Upsert Location Spoke
  const meta = resolveMunicipality(cityRaw || zipRaw || 'Federal Way');
  const cityName = meta ? meta.cityName : cityRaw;
  const spokeSlug = cityName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const county = meta ? meta.county : 'King County';
  const coordinates = meta ? meta.coords : [47.3073, -122.2285];
  const wikidataUri = meta ? meta.wikidataUri : 'https://www.wikidata.org/wiki/Q852586';
  const zipCodes = meta ? meta.zipCodes : (zipRaw ? [zipRaw] : ['98001']);

  const spoke = await db.locationSpoke.upsert({
    where: { slug: spokeSlug },
    create: {
      slug: spokeSlug,
      cityName,
      county,
      zipCodes,
      coordinates,
      wikidataUri
    },
    update: {
      ...(zipRaw && !zipCodes.includes(zipRaw) ? { zipCodes: { push: zipRaw } } : {})
    }
  });

  // 5. Generate Canonical Slug for /jobs/[slug]
  const canonicalJobSlug = generateJobSlug({
    service: serviceType,
    item: itemCategory,
    city: cityName,
    jobId: externalJobId
  });

  // 6. Match & Merge Logic (De-duplication)
  // Step A: Check if this exact externalJobId already exists
  let jobRecord = await db.jobStory.findUnique({
    where: { externalJobId }
  });

  let action = 'CREATED_NEW_JOB_STORY';

  if (jobRecord) {
    // Update existing record with refreshed telemetry
    jobRecord = await db.jobStory.update({
      where: { id: jobRecord.id },
      data: {
        slug: jobRecord.slug || canonicalJobSlug,
        serviceType: serviceType || jobRecord.serviceType,
        itemCategory: itemCategory || jobRecord.itemCategory,
        weightLbs: weightLbs ?? jobRecord.weightLbs,
        equipmentUsed: equipmentUsed || jobRecord.equipmentUsed,
        disposalSite: disposalSite || jobRecord.disposalSite,
        disposalReceipt: disposalReceipt || jobRecord.disposalReceipt,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : jobRecord.mediaUrls,
        customerReview: customerReview ?? jobRecord.customerReview,
        reviewRating: reviewRating ?? jobRecord.reviewRating,
        reviewerName: customerName !== 'Verified Client' ? customerName : jobRecord.reviewerName,
        reviewSource: jobRecord.reviewSource || (customerReview ? 'amzy' : null),
        completedAt
      }
    });
    action = 'UPDATED_EXISTING_AMZY_JOB';
  } else {
    // Step B: Search 3-day rolling window for a fuzzy match (Customer First Name + City + Service Type)
    const windowStart = new Date(completedAt.getTime() - 3 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000);

    const candidates = await db.jobStory.findMany({
      where: {
        locationId: spoke.id,
        completedAt: {
          gte: windowStart,
          lte: windowEnd
        }
      }
    });

    const incomingFirst = extractFirstName(customerName);
    const matchedCandidate = candidates.find(c => {
      const candidateFirst = extractFirstName(c.reviewerName);
      const nameMatches = incomingFirst && candidateFirst && incomingFirst === candidateFirst;
      const sMatches = serviceMatches(c.serviceType, serviceType);
      return nameMatches && sMatches;
    });

    if (matchedCandidate) {
      jobRecord = await db.jobStory.update({
        where: { id: matchedCandidate.id },
        data: {
          externalJobId,
          slug: matchedCandidate.slug || canonicalJobSlug,
          serviceType: serviceType || matchedCandidate.serviceType,
          itemCategory: itemCategory || matchedCandidate.itemCategory,
          weightLbs: weightLbs ?? matchedCandidate.weightLbs,
          equipmentUsed: equipmentUsed || matchedCandidate.equipmentUsed,
          disposalSite: disposalSite || matchedCandidate.disposalSite,
          disposalReceipt: disposalReceipt || matchedCandidate.disposalReceipt,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : matchedCandidate.mediaUrls,
          customerReview: matchedCandidate.customerReview || customerReview,
          reviewRating: matchedCandidate.reviewRating || reviewRating || 5,
          reviewerName: matchedCandidate.reviewerName || customerName,
          reviewSource: matchedCandidate.reviewSource || (customerReview ? 'amzy' : 'google')
        }
      });
      action = 'MERGED_REVIEW_AND_TELEMETRY';
    } else {
      jobRecord = await db.jobStory.create({
        data: {
          externalJobId,
          slug: canonicalJobSlug,
          locationId: spoke.id,
          serviceType,
          itemCategory,
          weightLbs,
          equipmentUsed,
          disposalSite,
          disposalReceipt,
          customerReview,
          reviewRating: reviewRating || 5,
          reviewerName: customerName,
          reviewSource: customerReview ? 'amzy' : null,
          reviewPlatform: 'Amzy',
          mediaUrls,
          completedAt
        }
      });
      action = 'CREATED_NEW_JOB_STORY';
    }
  }

  // 7. Ingest into Canonical Reputation Engine if customer review was included
  let updatedReputation = null;
  const ratingToRecord = reviewRating || 5;
  if (customerReview && ratingToRecord >= 4) {
    const isNewCustomerReview = action === 'CREATED_NEW_JOB_STORY' || action === 'MERGED_REVIEW_AND_TELEMETRY';
    if (isNewCustomerReview) {
      updatedReputation = recordReviewMetric({ platform: 'amzy', rating: ratingToRecord });
    }
  }

  // 8. On-Demand Incremental Static Regeneration (ISR)
  const targetSlug = jobRecord.slug || canonicalJobSlug;
  const tagsToInvalidate = [
    `location-${spoke.slug}`,
    `location-junk-removal-${spoke.slug}-wa`,
    `job-${targetSlug}`,
    'llms-manifest',
    'root-sitemap'
  ];

  for (const tag of tagsToInvalidate) {
    try {
      revalidateTag(tag);
    } catch (err) {
      console.warn(`Tag invalidation warning for ${tag}:`, err);
    }
  }

  try {
    revalidatePath(`/junk-removal-${spoke.slug}-wa`);
    revalidatePath(`/jobs/${targetSlug}`);
    revalidatePath('/jobs');
    revalidatePath('/llms.txt');
    revalidatePath('/sitemap.xml');
  } catch (err) {
    console.warn('Path invalidation warning:', err);
  }

  return NextResponse.json({
    success: true,
    action,
    jobId: jobRecord.id,
    externalJobId: jobRecord.externalJobId,
    canonicalSlug: targetSlug,
    canonicalUrl: `/jobs/${targetSlug}`,
    spokeSlug: spoke.slug,
    cityName: spoke.cityName,
    revalidatedTags: tagsToInvalidate,
    reputation: updatedReputation,
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/webhooks/amzy-job',
    accepts: ['POST'],
    supportedAuth: ['Bearer <DISPATCH_WEBHOOK_SECRET>', 'x-webhook-secret', 'x-amzy-secret']
  });
}
