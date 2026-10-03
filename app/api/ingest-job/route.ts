import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { resolveMunicipality } from '@/lib/geo-resolver';

const IngestPayloadSchema = z.object({
  jobId: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  serviceType: z.string().optional().default('Junk Removal & Hauling'),
  itemCategory: z.string().optional().default('Bulky Items & General Debris'),
  weightLbs: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  equipment: z.string().optional().default('16-foot High-Wall Box Truck'),
  disposalSite: z.string().optional().default('Regional Certified Transfer Station'),
  disposalReceipt: z.string().optional(),
  // Review fields (supports GBP/Zapier formats)
  review: z.string().optional(),
  text: z.string().optional(),
  comment: z.string().optional(),
  rating: z.union([z.number(), z.string().transform(Number)]).optional().default(5),
  customerName: z.string().optional(),
  name: z.string().optional(),
  reviewPlatform: z.string().optional().default('Google'),
  exactReviewUrl: z.string().url().optional(),
  reviewUrl: z.string().url().optional(),
  completedAt: z.string().optional()
});

export async function POST(req: NextRequest) {
  // 1. Authenticate Request
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.DISPATCH_WEBHOOK_SECRET || process.env.REVIEWS_WEBHOOK_SECRET;

  if (expectedSecret) {
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const provided = bearerToken || secretHeader;
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }
  }

  // 2. Parse Payload
  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = IngestPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const p = parsed.data;
  const reviewText = p.review || p.text || p.comment || null;
  const reviewer = p.customerName || p.name || 'Verified Customer';
  const reviewLink = p.reviewUrl || p.exactReviewUrl || null;
  const targetCityOrZip = p.city || p.zip || 'Federal Way';

  // 3. Resolve Municipality
  const meta = resolveMunicipality(targetCityOrZip);
  const cityName = meta ? meta.cityName : (p.city || 'Federal Way');
  const slug = cityName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const county = meta ? meta.county : 'King County';
  const coordinates = meta ? meta.coords : [47.3223, -122.3126];
  const wikidataUri = meta ? meta.wikidataUri : 'https://www.wikidata.org/wiki/Q852586';
  const zipCodes = meta ? meta.zipCodes : (p.zip ? [p.zip] : ['98003']);

  // 4. Upsert Location Spoke
  const spoke = await db.locationSpoke.upsert({
    where: { slug },
    create: {
      slug,
      cityName,
      county,
      zipCodes,
      coordinates,
      wikidataUri
    },
    update: {
      ...(p.zip ? { zipCodes: { push: p.zip } } : {})
    }
  });

  // 5. Upsert / Stage / Merge Job Story
  let jobRecord;
  if (p.jobId) {
    // Merge into staged job record
    const existingJob = await db.jobStory.findUnique({ where: { id: p.jobId } });
    if (existingJob) {
      jobRecord = await db.jobStory.update({
        where: { id: p.jobId },
        data: {
          customerReview: reviewText ?? existingJob.customerReview,
          reviewRating: p.rating ?? existingJob.reviewRating,
          reviewerName: reviewer ?? existingJob.reviewerName,
          reviewUrl: reviewLink ?? existingJob.reviewUrl,
          weightLbs: p.weightLbs ?? existingJob.weightLbs,
          disposalReceipt: p.disposalReceipt ?? existingJob.disposalReceipt
        }
      });
    }
  }

  if (!jobRecord) {
    jobRecord = await db.jobStory.create({
      data: {
        locationId: spoke.id,
        serviceType: p.serviceType,
        itemCategory: p.itemCategory,
        weightLbs: p.weightLbs ?? null,
        equipmentUsed: p.equipment,
        disposalSite: p.disposalSite,
        disposalReceipt: p.disposalReceipt ?? null,
        customerReview: reviewText,
        reviewRating: p.rating,
        reviewerName: reviewer,
        reviewPlatform: p.reviewPlatform,
        reviewUrl: reviewLink,
        completedAt: p.completedAt ? new Date(p.completedAt) : new Date()
      }
    });
  }

  // 6. Selective On-Demand ISR Invalidation
  const tagsToInvalidate = [
    `location-${slug}`,
    `location-junk-removal-${slug}-wa`,
    'llms-manifest',
    'root-sitemap'
  ];

  for (const tag of tagsToInvalidate) {
    revalidateTag(tag);
  }

  revalidatePath(`/junk-removal-${slug}-wa`);
  revalidatePath('/jobs');
  revalidatePath('/llms.txt');

  return NextResponse.json({
    success: true,
    action: p.jobId ? 'MERGED_STAGED_JOB' : 'INGESTED_NEW_JOB',
    jobId: jobRecord.id,
    municipality: spoke.cityName,
    spokeSlug: spoke.slug,
    revalidatedTags: tagsToInvalidate
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/ingest-job',
    accepts: ['POST'],
    supportedAuth: ['Bearer <DISPATCH_WEBHOOK_SECRET>', 'x-webhook-secret']
  });
}
