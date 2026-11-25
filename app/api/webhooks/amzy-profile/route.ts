import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAmzyWebhookRequest } from '@/lib/amzy-webhook-auth';

const AmzyProfileSyncSchema = z.object({
  event: z.string().optional(),
  kbVersion: z.string().optional().default('1.0'),
  kbRevision: z.number().int().nonnegative().default(1),
  force: z.boolean().optional().default(false),
  updatedAt: z.string().optional(),
  identity: z.object({
    brandName: z.string().min(1),
    legalName: z.string().min(1),
    ownerName: z.string().optional(),
    phone: z.string().min(5),
    email: z.string().email(),
    domain: z.string().optional(),
    canonicalUrl: z.string().url(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    foundedYear: z.number().int().optional(),
    languages: z.array(z.string()).optional(),
  }),
  baseLocation: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    county: z.string().optional(),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().optional().default('US'),
    lat: z.number(),
    lng: z.number(),
    serviceRadiusMiles: z.number().positive().optional().default(30),
  }),
  locationSpokes: z
    .array(
      z.object({
        slug: z.string().optional(),
        citySlug: z.string().optional(),
        city: z.string().min(1),
        state: z.string().optional(),
        county: z.string().optional(),
        postalCodes: z.array(z.string()).optional().default([]),
        lat: z.number().optional(),
        lng: z.number().optional(),
        distanceMiles: z.number().nullable().optional(),
        isPrimaryHub: z.boolean().optional(),
        neighborhoods: z.array(z.string()).optional(),
        population: z.number().int().nullable().optional(),
        wikidataUri: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  amzyPlatform: z
    .object({
      appId: z.string().optional(),
      trackerSlug: z.string().optional(),
      schedulerUrl: z.string().optional(),
      discoveryProviderId: z.string().optional(),
    })
    .optional(),
  fleet: z.record(z.string(), z.unknown()).optional(),
  operatingHours: z.record(z.string(), z.unknown()).optional(),
  pricing: z.record(z.string(), z.unknown()).optional(),
  baseServices: z
    .array(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        category: z.string().optional().default('Core Hauling'),
        shortDescription: z.string().min(1),
        longDescription: z.string().optional(),
        basePrice: z.number().positive().optional(),
        estimatedTimeHours: z.number().positive().optional(),
      })
    )
    .optional()
    .default([]),
  branding: z.record(z.string(), z.unknown()).optional(),
  externalLinks: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
  }

  const auth = verifyAmzyWebhookRequest(req, rawText);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = AmzyProfileSyncSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const p = parsed.data;

  // Monotonic kbRevision guard: prevent stale migrations or out-of-order pushes from reverting live KB state
  const existing = await db.businessProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);
  if (existing && !p.force && p.kbRevision <= existing.kbRevision) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'stale_kb_revision',
      currentRevision: existing.kbRevision,
      incomingRevision: p.kbRevision,
    });
  }

  await db.businessProfile.upsert({
    where: { id: 'primary' },
    create: {
      id: 'primary',
      appId: p.amzyPlatform?.appId || null,
      kbVersion: p.kbVersion,
      kbRevision: p.kbRevision,
      brandName: p.identity.brandName,
      legalName: p.identity.legalName,
      ownerName: p.identity.ownerName || null,
      phone: p.identity.phone,
      email: p.identity.email,
      domain: p.identity.domain || null,
      canonicalUrl: p.identity.canonicalUrl,
      tagline: p.identity.tagline || null,
      description: p.identity.description || null,
      foundedYear: p.identity.foundedYear || null,
      languages: p.identity.languages || ['English'],
      street: p.baseLocation.street,
      city: p.baseLocation.city,
      county: p.baseLocation.county || null,
      state: p.baseLocation.state,
      postalCode: p.baseLocation.postalCode,
      country: p.baseLocation.country || 'US',
      lat: p.baseLocation.lat,
      lng: p.baseLocation.lng,
      serviceRadiusMiles: p.baseLocation.serviceRadiusMiles,
      trackerSlug: p.amzyPlatform?.trackerSlug || null,
      schedulerUrl: p.amzyPlatform?.schedulerUrl || null,
      discoveryProviderId: p.amzyPlatform?.discoveryProviderId || null,
      operatingHoursJson: (p.operatingHours || {}) as any,
      pricingJson: (p.pricing || {}) as any,
      fleetJson: (p.fleet || {}) as any,
      brandingJson: (p.branding || {}) as any,
      externalLinksJson: (p.externalLinks || {}) as any,
      syncedAt: new Date(),
    },
    update: {
      appId: p.amzyPlatform?.appId ?? undefined,
      kbVersion: p.kbVersion,
      kbRevision: p.kbRevision,
      brandName: p.identity.brandName,
      legalName: p.identity.legalName,
      ownerName: p.identity.ownerName ?? undefined,
      phone: p.identity.phone,
      email: p.identity.email,
      domain: p.identity.domain ?? undefined,
      canonicalUrl: p.identity.canonicalUrl,
      tagline: p.identity.tagline ?? undefined,
      description: p.identity.description ?? undefined,
      foundedYear: p.identity.foundedYear ?? undefined,
      languages: p.identity.languages ?? undefined,
      street: p.baseLocation.street,
      city: p.baseLocation.city,
      county: p.baseLocation.county ?? undefined,
      state: p.baseLocation.state,
      postalCode: p.baseLocation.postalCode,
      country: p.baseLocation.country || 'US',
      lat: p.baseLocation.lat,
      lng: p.baseLocation.lng,
      serviceRadiusMiles: p.baseLocation.serviceRadiusMiles,
      trackerSlug: p.amzyPlatform?.trackerSlug ?? undefined,
      schedulerUrl: p.amzyPlatform?.schedulerUrl ?? undefined,
      discoveryProviderId: p.amzyPlatform?.discoveryProviderId ?? undefined,
      operatingHoursJson: (p.operatingHours || {}) as any,
      pricingJson: (p.pricing || {}) as any,
      fleetJson: (p.fleet || {}) as any,
      brandingJson: (p.branding || {}) as any,
      externalLinksJson: (p.externalLinks || {}) as any,
      syncedAt: new Date(),
    },
  });

  // Ensure Day-0 empty ReputationProfile exists without creating synthetic ratings
  const existingRep = await db.reputationProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);
  if (!existingRep) {
    await db.reputationProfile.create({
      data: {
        id: 'primary',
        reviewCount: 0,
        ratingValue: null,
        aggregateRating: null,
      },
    });
  }

  // Upsert LocationSpokes scoped strictly to this contractor's KB
  const syncedSpokes: string[] = [];
  for (const spoke of p.locationSpokes) {
    const citySlug = (
      spoke.citySlug ||
      spoke.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
    ).replace(/^-+|-+$/g, '');
    if (!citySlug) continue;

    await db.locationSpoke.upsert({
      where: { slug: citySlug },
      create: {
        slug: citySlug,
        cityName: spoke.city,
        state: spoke.state || p.baseLocation.state,
        county: spoke.county || p.baseLocation.county || `${spoke.city} Area`,
        zipCodes: spoke.postalCodes || [],
        coordinates: [
          spoke.lat ?? p.baseLocation.lat,
          spoke.lng ?? p.baseLocation.lng,
        ],
        distanceMiles: spoke.distanceMiles ?? null,
        isPrimaryHub: Boolean(spoke.isPrimaryHub),
        neighborhoods: spoke.neighborhoods || [],
        population: spoke.population ?? null,
        wikidataUri: spoke.wikidataUri || '',
      },
      update: {
        cityName: spoke.city,
        state: spoke.state || p.baseLocation.state,
        county: spoke.county || p.baseLocation.county || `${spoke.city} Area`,
        zipCodes: spoke.postalCodes || [],
        coordinates: [
          spoke.lat ?? p.baseLocation.lat,
          spoke.lng ?? p.baseLocation.lng,
        ],
        distanceMiles: spoke.distanceMiles ?? null,
        isPrimaryHub: Boolean(spoke.isPrimaryHub),
        neighborhoods: spoke.neighborhoods || [],
        population: spoke.population ?? null,
        ...(spoke.wikidataUri ? { wikidataUri: spoke.wikidataUri } : {}),
      },
    });
    syncedSpokes.push(citySlug);
  }

  // Upsert Stream A core base services (preserving any auto-discovered niche services)
  const syncedServices: string[] = [];
  for (const svc of p.baseServices) {
    await db.serviceOffering.upsert({
      where: { slug: svc.slug },
      create: {
        slug: svc.slug,
        name: svc.name,
        category: svc.category,
        shortDescription: svc.shortDescription,
        longDescription: svc.longDescription || null,
        basePrice: svc.basePrice ?? null,
        estimatedTimeHours: svc.estimatedTimeHours ?? null,
        isCoreBase: true,
        autoDiscovered: false,
        isActive: true,
      },
      update: {
        name: svc.name,
        category: svc.category,
        shortDescription: svc.shortDescription,
        ...(svc.longDescription ? { longDescription: svc.longDescription } : {}),
        ...(svc.basePrice !== undefined ? { basePrice: svc.basePrice } : {}),
        ...(svc.estimatedTimeHours !== undefined ? { estimatedTimeHours: svc.estimatedTimeHours } : {}),
        isCoreBase: true,
        isActive: true,
      },
    });
    syncedServices.push(svc.slug);
  }

  const tags = ['profile', 'service-area', 'services', 'llms-manifest', 'root-sitemap'];
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {}
  }
  for (const pth of ['/', '/services', '/locations', '/llms.txt', '/sitemap.xml']) {
    try {
      revalidatePath(pth);
    } catch {}
  }

  return NextResponse.json({
    success: true,
    action: 'PROFILE_SYNCED',
    kbRevision: p.kbRevision,
    brandName: p.identity.brandName,
    spokesSynced: syncedSpokes.length,
    servicesSynced: syncedServices.length,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/webhooks/amzy-profile',
    accepts: ['POST'],
    supportedAuth: ['X-Amzy-Signature + X-Amzy-Timestamp (HMAC-SHA256)', 'Bearer <AMZY_WEBHOOK_SECRET>'],
  });
}
