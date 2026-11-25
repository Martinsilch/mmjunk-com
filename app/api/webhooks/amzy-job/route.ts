import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { resolveMunicipality } from '@/lib/geo-resolver';
import { generateJobSlug, extractFirstName, serviceMatches, sanitizeReviewText } from '@/lib/job-utils';
import { recordReviewMetricDb, upsertCharacterSignalsDb } from '@/lib/reputation';
import { verifyAmzyWebhookRequest } from '@/lib/amzy-webhook-auth';

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

const CanonicalServiceSchema = z.object({
  canonicalSlug: z.string().min(1),
  serviceName: z.string().min(1),
  category: z.string().optional().default('Core Hauling'),
  shortDescription: z.string().optional().default(''),
  isNewDiscovery: z.boolean().optional(),
  autoCreateServicePayload: z
    .object({
      slug: z.string().min(1),
      name: z.string().min(1),
      category: z.string().optional().default('Core Hauling'),
      shortDescription: z.string().optional().default(''),
    })
    .nullable()
    .optional(),
});

const CharacterSignalPayloadSchema = z.object({
  dimension: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  sourceType: z.string().optional(),
  evidenceCount: z.number().int().positive().optional(),
  matchedSignals: z.array(z.string()).optional(),
});

const AmzyJobPayloadSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  completedAt: z.string().optional(),
  customer: AmzyCustomerSchema.optional(),
  telemetry: AmzyTelemetrySchema.optional(),
  // Pre-classified metadata pushed by AMZY Platform (proprietary classification stays in AMZY)
  canonicalService: CanonicalServiceSchema.optional(),
  autoCreateServicePayload: CanonicalServiceSchema.shape.autoCreateServicePayload,
  characterSignals: z.array(CharacterSignalPayloadSchema).optional().default([]),
  volumeCubicYards: z.number().optional(),
  cubicYards: z.number().optional(),
  truckVolumeFraction: z.string().optional(),
  diversionRatePct: z.number().optional(),
  divertPercentage: z.number().optional(),
  // Flat fallback fields
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  postalCode: z.string().optional(),
  service: z.string().optional(),
  serviceName: z.string().optional(),
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
  beforePhotoUrls: z.array(z.string()).optional(),
  afterPhotoUrls: z.array(z.string()).optional(),
  customerReview: z.string().optional(),
  review: z.string().optional(),
  comment: z.string().optional(),
  reviewRating: z.union([z.number(), z.string().transform(Number)]).optional(),
  rating: z.union([z.number(), z.string().transform(Number)]).optional(),
  reviewerName: z.string().optional(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Authenticate Request via HMAC-SHA256 or Bearer/token secret over raw bytes
  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
  }

  const auth = verifyAmzyWebhookRequest(req, rawText);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: invalid or missing webhook signature/secret token' },
      { status: 401 }
    );
  }

  // 2. Parse & Validate Payload
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawText);
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
  const profile = await db.businessProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);

  // 3. Extract & Normalize Fields scoped to synced contractor profile (no hardcoded Federal Way fallback when profile exists)
  const externalJobId = p.jobId;
  const customerName = p.customer?.name || p.reviewerName || p.name || 'Verified Client';
  const cityRaw = p.customer?.city || p.city || profile?.city || 'Service Area';
  const stateRaw = p.state || profile?.state || 'WA';
  const zipRaw = p.customer?.zip || p.zip || p.postalCode || profile?.postalCode || '';
  const serviceType = p.canonicalService?.serviceName || p.telemetry?.service || p.serviceName || p.service || p.serviceType || 'Junk Removal';
  const canonicalServiceSlug = p.canonicalService?.canonicalSlug || p.autoCreateServicePayload?.slug || null;
  const itemCategory = p.telemetry?.item || p.item || p.itemCategory || 'Mixed Hauling Items';
  const weightLbs = p.telemetry?.weightLbs ?? p.weightLbs ?? null;
  const volumeCubicYards = p.volumeCubicYards ?? p.cubicYards ?? null;
  const truckVolumeFraction = p.truckVolumeFraction || null;
  const diversionRatePct = p.diversionRatePct ?? p.divertPercentage ?? null;
  const equipmentUsed = p.telemetry?.equipment || p.equipment || p.equipmentUsed || null;
  const disposalSite = p.telemetry?.disposalFacility || p.disposalFacility || p.disposalSite || null;
  const disposalReceipt = p.telemetry?.dumpReceiptNumber || p.dumpReceiptNumber || p.disposalReceipt || null;
  const mediaUrls = p.telemetry?.photos || p.photos || p.mediaUrls || [];
  const beforePhotoUrls = p.beforePhotoUrls || [];
  const afterPhotoUrls = p.afterPhotoUrls || [];
  const rawReview = p.customerReview || p.review || p.comment || null;
  const customerReview = rawReview ? sanitizeReviewText(rawReview) : null;
  const reviewRating = p.reviewRating ?? p.rating ?? (customerReview ? 5 : null);
  const completedAt = p.completedAt ? new Date(p.completedAt) : new Date();

  // 4. Resolve Municipality & Upsert Location Spoke
  const meta = resolveMunicipality(cityRaw || zipRaw);
  const cityName = meta ? meta.cityName : cityRaw;
  const spokeSlug = cityName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const county = meta ? meta.county : (profile?.county || `${cityName} Area`);
  const coordinates = meta ? meta.coords : (profile ? [profile.lat, profile.lng] : [0, 0]);
  const wikidataUri = meta ? meta.wikidataUri : '';
  const zipCodes = meta ? meta.zipCodes : (zipRaw ? [zipRaw] : []);

  const spoke = await db.locationSpoke.upsert({
    where: { slug: spokeSlug },
    create: {
      slug: spokeSlug,
      cityName,
      state: stateRaw,
      county,
      zipCodes,
      coordinates,
      wikidataUri
    },
    update: {
      ...(zipRaw && !zipCodes.includes(zipRaw) ? { zipCodes: { push: zipRaw } } : {})
    }
  });

  // 4b. Auto-discover / upsert ServiceOffering from AMZY-classified service payload
  let linkedServiceId: string | null = null;
  const svcSeed = p.autoCreateServicePayload || (p.canonicalService ? {
    slug: p.canonicalService.canonicalSlug,
    name: p.canonicalService.serviceName,
    category: p.canonicalService.category || 'Core Hauling',
    shortDescription: p.canonicalService.shortDescription || `${p.canonicalService.serviceName} in ${cityName}.`,
  } : null);

  let discoveredNewService = false;
  let promotedService = false;
  if (svcSeed) {
    const meetsQualityThreshold =
      (mediaUrls.length > 0 && (reviewRating ?? 0) >= 4) ||
      Boolean(customerReview && (reviewRating ?? 0) >= 4);

    const existingSvc = await db.serviceOffering.findUnique({ where: { slug: svcSeed.slug } }).catch(() => null);
    if (!existingSvc) {
      discoveredNewService = meetsQualityThreshold;
      const createdSvc = await db.serviceOffering.create({
        data: {
          slug: svcSeed.slug,
          name: svcSeed.name,
          category: svcSeed.category || 'Core Hauling',
          shortDescription: svcSeed.shortDescription || `${svcSeed.name} executed with verified AMZY telemetry.`,
          isCoreBase: false,
          autoDiscovered: true,
          discoveredFromJobId: externalJobId,
          status: meetsQualityThreshold ? 'ACTIVE' : 'CANDIDATE',
          isActive: meetsQualityThreshold,
        },
      });
      linkedServiceId = createdSvc.id;
    } else {
      linkedServiceId = existingSvc.id;
      if (existingSvc.status === 'CANDIDATE' || !existingSvc.isActive) {
        const linkedJobCount = await db.jobStory.count({ where: { serviceId: existingSvc.id } }).catch(() => 0);
        if (linkedJobCount >= 1 || meetsQualityThreshold) {
          await db.serviceOffering.update({
            where: { id: existingSvc.id },
            data: { status: 'ACTIVE', isActive: true },
          });
          discoveredNewService = true;
          promotedService = true;
        }
      }
    }
  }

  // 5. Generate Canonical Slug for /jobs/[slug]
  const canonicalJobSlug = generateJobSlug({
    service: serviceType,
    item: itemCategory,
    city: cityName,
    jobId: externalJobId
  });

  // 6. Match & Merge Logic (De-duplication)
  let jobRecord = await db.jobStory.findUnique({
    where: { externalJobId }
  });

  let action = 'CREATED_NEW_JOB_STORY';

  if (jobRecord) {
    jobRecord = await db.jobStory.update({
      where: { id: jobRecord.id },
      data: {
        slug: jobRecord.slug || canonicalJobSlug,
        serviceId: linkedServiceId ?? jobRecord.serviceId,
        canonicalServiceSlug: canonicalServiceSlug ?? jobRecord.canonicalServiceSlug,
        serviceType: serviceType || jobRecord.serviceType,
        itemCategory: itemCategory || jobRecord.itemCategory,
        weightLbs: weightLbs ?? jobRecord.weightLbs,
        volumeCubicYards: volumeCubicYards ?? jobRecord.volumeCubicYards,
        truckVolumeFraction: truckVolumeFraction ?? jobRecord.truckVolumeFraction,
        diversionRatePct: diversionRatePct ?? jobRecord.diversionRatePct,
        diversionFacility: disposalSite ?? jobRecord.diversionFacility,
        equipmentUsed: equipmentUsed || jobRecord.equipmentUsed,
        disposalSite: disposalSite || jobRecord.disposalSite,
        disposalReceipt: disposalReceipt || jobRecord.disposalReceipt,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : jobRecord.mediaUrls,
        beforePhotoUrls: beforePhotoUrls.length > 0 ? beforePhotoUrls : jobRecord.beforePhotoUrls,
        afterPhotoUrls: afterPhotoUrls.length > 0 ? afterPhotoUrls : jobRecord.afterPhotoUrls,
        characterSignalsJson: (p.characterSignals.length > 0 ? p.characterSignals : jobRecord.characterSignalsJson) as any,
        customerReview: customerReview ?? jobRecord.customerReview,
        reviewRating: reviewRating ?? jobRecord.reviewRating,
        reviewerName: customerName !== 'Verified Client' ? customerName : jobRecord.reviewerName,
        reviewSource: jobRecord.reviewSource || (customerReview ? 'amzy' : null),
        completedAt
      }
    });
    action = 'UPDATED_EXISTING_AMZY_JOB';
  } else {
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
          serviceId: linkedServiceId ?? matchedCandidate.serviceId,
          canonicalServiceSlug: canonicalServiceSlug ?? matchedCandidate.canonicalServiceSlug,
          serviceType: serviceType || matchedCandidate.serviceType,
          itemCategory: itemCategory || matchedCandidate.itemCategory,
          weightLbs: weightLbs ?? matchedCandidate.weightLbs,
          volumeCubicYards: volumeCubicYards ?? matchedCandidate.volumeCubicYards,
          truckVolumeFraction: truckVolumeFraction ?? matchedCandidate.truckVolumeFraction,
          diversionRatePct: diversionRatePct ?? matchedCandidate.diversionRatePct,
          diversionFacility: disposalSite ?? matchedCandidate.diversionFacility,
          equipmentUsed: equipmentUsed || matchedCandidate.equipmentUsed,
          disposalSite: disposalSite || matchedCandidate.disposalSite,
          disposalReceipt: disposalReceipt || matchedCandidate.disposalReceipt,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : matchedCandidate.mediaUrls,
          beforePhotoUrls: beforePhotoUrls.length > 0 ? beforePhotoUrls : matchedCandidate.beforePhotoUrls,
          afterPhotoUrls: afterPhotoUrls.length > 0 ? afterPhotoUrls : matchedCandidate.afterPhotoUrls,
          characterSignalsJson: (p.characterSignals.length > 0 ? p.characterSignals : matchedCandidate.characterSignalsJson) as any,
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
          serviceId: linkedServiceId,
          canonicalServiceSlug,
          serviceType,
          itemCategory,
          weightLbs,
          volumeCubicYards,
          truckVolumeFraction,
          diversionRatePct,
          diversionFacility: disposalSite,
          equipmentUsed,
          disposalSite,
          disposalReceipt,
          customerReview,
          reviewRating: reviewRating || 5,
          reviewerName: customerName,
          reviewSource: customerReview ? 'amzy' : null,
          reviewPlatform: 'Amzy',
          mediaUrls,
          beforePhotoUrls,
          afterPhotoUrls,
          characterSignalsJson: (p.characterSignals.length > 0 ? p.characterSignals : undefined) as any,
          completedAt
        }
      });
      action = 'CREATED_NEW_JOB_STORY';
    }
  }

  // 7. Persist CharacterSignals & Reputation Metrics in Neon Postgres
  if (p.characterSignals.length > 0) {
    const validSignals = p.characterSignals.filter(
      (s): s is { dimension: string; label: string; summary: string; sourceType?: string; evidenceCount?: number; matchedSignals?: string[] } =>
        Boolean(s.dimension && s.label && s.summary)
    );
    await upsertCharacterSignalsDb(validSignals).catch((err) =>
      console.warn('[CharacterSignal] Upsert warning:', err)
    );
  }

  let updatedReputation = null;
  const ratingToRecord = reviewRating || 5;
  if (customerReview && ratingToRecord >= 4) {
    const isNewCustomerReview = action === 'CREATED_NEW_JOB_STORY' || action === 'MERGED_REVIEW_AND_TELEMETRY';
    if (isNewCustomerReview) {
      updatedReputation = await recordReviewMetricDb({ platform: 'amzy', rating: ratingToRecord });
      await db.customerReview.upsert({
        where: { externalId: `amzy_rev_${externalJobId}` },
        create: {
          externalId: `amzy_rev_${externalJobId}`,
          platform: 'Amzy',
          authorName: customerName,
          rating: ratingToRecord,
          reviewText: customerReview,
          reviewDate: completedAt,
          locationCity: cityName,
          jobStoryId: jobRecord.id,
          publishedToApp: true,
        },
        update: {
          rating: ratingToRecord,
          reviewText: customerReview,
          jobStoryId: jobRecord.id,
        },
      }).catch(() => {});
    }
  }

  // 8. On-Demand Incremental Static Regeneration (ISR)
  const targetSlug = jobRecord.slug || canonicalJobSlug;
  const stateSuffix = (spoke.state || stateRaw || 'wa').toLowerCase();
  const tagsToInvalidate = [
    `location-${spoke.slug}`,
    `location-junk-removal-${spoke.slug}-${stateSuffix}`,
    `job-${targetSlug}`,
    'services',
    'reputation',
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
    revalidatePath(`/junk-removal-${spoke.slug}-${stateSuffix}`);
    revalidatePath(`/jobs/${targetSlug}`);
    revalidatePath('/jobs');
    revalidatePath('/services');
    if (canonicalServiceSlug) {
      revalidatePath(`/services/${canonicalServiceSlug}`);
    }
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
    canonicalServiceSlug,
    discoveredNewService,
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
    supportedAuth: ['X-Amzy-Signature + X-Amzy-Timestamp (HMAC-SHA256)', 'Bearer <DISPATCH_WEBHOOK_SECRET>', 'x-webhook-secret', 'x-amzy-secret']
  });
}
