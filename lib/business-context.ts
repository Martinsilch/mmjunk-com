import { db } from '@/lib/db';
import {
  getReputationMetrics,
  getReputationMetricsFromDb,
  type ReputationWithSignals,
} from '@/lib/reputation';

export interface ContractorContext {
  isConfiguredFromDb: boolean;
  isColdStartEnv: boolean;
  brandName: string;
  legalName: string;
  ownerName: string;
  phone: string;
  displayPhone: string;
  email: string;
  domain: string;
  canonicalUrl: string;
  tagline: string;
  description: string;
  street: string;
  city: string;
  county: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  serviceRadiusMiles: number;
  bookingUrl: string;
  trackerSlug: string;
  operatingHours: Record<string, string>;
  pricing: Record<string, unknown>;
  fleet: Record<string, unknown>;
  externalLinks: Record<string, string | null | undefined>;
  sameAsUrls: string[];
}

export function formatPhoneDisplay(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return raw || '';
}

export async function getContractorContext(): Promise<ContractorContext> {
  const dbProfile = await db.businessProfile
    .findUnique({ where: { id: 'primary' } })
    .catch(() => null);

  if (dbProfile) {
    const extLinks = (dbProfile.externalLinksJson as Record<string, string | null | undefined>) || {};
    const sameAsUrls = [
      extLinks.googleMapsUrl,
      extLinks.bbbUrl,
      extLinks.yelpUrl,
      extLinks.facebookUrl,
      extLinks.youtubeUrl,
      dbProfile.schedulerUrl,
    ].filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)));

    return {
      isConfiguredFromDb: true,
      isColdStartEnv: false,
      brandName: dbProfile.brandName,
      legalName: dbProfile.legalName,
      ownerName: dbProfile.ownerName || 'Owner-Operator',
      phone: dbProfile.phone,
      displayPhone: formatPhoneDisplay(dbProfile.phone),
      email: dbProfile.email,
      domain: dbProfile.domain || new URL(dbProfile.canonicalUrl).hostname,
      canonicalUrl: dbProfile.canonicalUrl.replace(/\/$/, ''),
      tagline: dbProfile.tagline || `Local Junk Removal & Hauling in ${dbProfile.city}, ${dbProfile.state}`,
      description:
        dbProfile.description ||
        `${dbProfile.brandName} provides upfront residential and commercial junk removal across ${dbProfile.city}, ${dbProfile.state}.`,
      street: dbProfile.street,
      city: dbProfile.city,
      county: dbProfile.county || `${dbProfile.city} Area`,
      state: dbProfile.state,
      postalCode: dbProfile.postalCode,
      country: dbProfile.country || 'US',
      lat: dbProfile.lat,
      lng: dbProfile.lng,
      serviceRadiusMiles: dbProfile.serviceRadiusMiles,
      bookingUrl: dbProfile.schedulerUrl || 'https://amzy.me',
      trackerSlug: dbProfile.trackerSlug || '',
      operatingHours: (dbProfile.operatingHoursJson as Record<string, string>) || {},
      pricing: (dbProfile.pricingJson as Record<string, unknown>) || {},
      fleet: (dbProfile.fleetJson as Record<string, unknown>) || {},
      externalLinks: extLinks,
      sameAsUrls,
    };
  }

  // Env-configured Day-0 cold start (no DB BusinessProfile yet, but provisioned for a contractor)
  const envBrand = process.env.MERCHANT_BUSINESS_NAME || '';
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isStrictColdStart =
    process.env.STRICT_COLD_START === 'true' || Boolean(envBrand) || (Boolean(envUrl) && !envUrl.includes('mmjunk.com'));

  if (isStrictColdStart) {
    const city = process.env.AMZY_BASE_CITY || 'Service Area';
    const state = process.env.AMZY_BASE_STATE || 'US';
    const [latStr, lngStr] = (process.env.AMZY_BASE_COORDS || '0,0').split(',');
    const canonical = (envUrl || 'https://amzy.me').replace(/\/$/, '');
    const phone = process.env.MERCHANT_PHONE || '';
    const bookingUrl = process.env.AMZY_SCHEDULER_TRACKING_URL || 'https://amzy.me';

    return {
      isConfiguredFromDb: false,
      isColdStartEnv: true,
      brandName: envBrand || 'Local Junk Removal Dispatch',
      legalName: envBrand ? `${envBrand} LLC` : 'Local Junk Removal LLC',
      ownerName: 'Dispatch Team',
      phone,
      displayPhone: formatPhoneDisplay(phone),
      email: process.env.MERCHANT_EMAIL || 'dispatch@amzy.me',
      domain: (() => {
        try {
          return new URL(canonical).hostname;
        } catch {
          return 'amzy.me';
        }
      })(),
      canonicalUrl: canonical,
      tagline: `Local Junk Removal & Hauling in ${city}, ${state}`,
      description: `Upfront volume-based residential and commercial junk removal in ${city}, ${state}.`,
      street: 'Primary Dispatch',
      city,
      county: `${city} Area`,
      state,
      postalCode: '',
      country: 'US',
      lat: Number(latStr) || 0,
      lng: Number(lngStr) || 0,
      serviceRadiusMiles: Number(process.env.AMZY_SERVICE_RADIUS) || 30,
      bookingUrl,
      trackerSlug: '',
      operatingHours: {},
      pricing: {},
      fleet: {},
      externalLinks: {},
      sameAsUrls: bookingUrl ? [bookingUrl] : [],
    };
  }

  // Legacy M&M pre-backfill fallback so existing M&M site never breaks prior to Step 5 backfill
  return {
    isConfiguredFromDb: false,
    isColdStartEnv: false,
    brandName: 'M&M Junk Removal',
    legalName: 'M&M Junk Removal LLC',
    ownerName: 'Martin Silch',
    phone: '+1-253-886-7724',
    displayPhone: '(253) 886-7724',
    email: 'dispatch@mmjunk.com',
    domain: 'www.mmjunk.com',
    canonicalUrl: 'https://www.mmjunk.com',
    tagline: 'South King & Pierce County Junk Removal & Hauling',
    description:
      'M&M Junk Removal delivers upfront, owner-operated residential and commercial junk removal, estate cleanouts, and light demolition across South King & Pierce Counties.',
    street: '31200 Pacific Hwy S',
    city: 'Federal Way',
    county: 'King County',
    state: 'WA',
    postalCode: '98003',
    country: 'US',
    lat: 47.3223,
    lng: -122.3126,
    serviceRadiusMiles: 35,
    bookingUrl: 'https://amzy.me/?utm_content=4',
    trackerSlug: 'mam-federalway',
    operatingHours: {
      mondayToFriday: '7:00 AM - 7:00 PM PST',
      saturday: '7:00 AM - 6:00 PM PST',
    },
    pricing: {},
    fleet: {},
    externalLinks: {
      googleMapsUrl: 'https://www.google.com/maps?cid=15999711673070107161',
      bbbUrl: 'https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173',
      yelpUrl: 'https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3',
      facebookUrl: 'https://www.facebook.com/mmjunkremoval/',
    },
    sameAsUrls: [
      'https://www.google.com/maps?cid=15999711673070107161',
      'https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173',
      'https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3',
      'https://www.facebook.com/mmjunkremoval/',
      'https://amzy.me/?utm_content=4',
    ],
  };
}

/**
 * Returns authoritative reputation metrics with Day-0 zero-fabrication safety.
 * Never returns synthetic stars when a BusinessProfile or strict cold-start DB has 0 reviews.
 */
export async function getEffectiveReputation(): Promise<ReputationWithSignals> {
  const [dbProfile, dbRep] = await Promise.all([
    db.businessProfile.findUnique({ where: { id: 'primary' } }).catch(() => null),
    getReputationMetricsFromDb(),
  ]);

  if (dbProfile || dbRep.reviewCount > 0 || process.env.STRICT_COLD_START === 'true' || Boolean(process.env.MERCHANT_BUSINESS_NAME)) {
    return dbRep;
  }

  // Pre-backfill legacy M&M fallback
  const legacy = getReputationMetrics();
  return {
    reviewCount: legacy.reviewCount,
    ratingValue: legacy.ratingValue,
    aggregateRating: legacy.aggregateRating,
    breakdown: {
      google: {
        reviewCount: legacy.breakdown.google?.reviewCount || 0,
        rating: legacy.breakdown.google?.rating ?? null,
        platform: 'Google Business Profile',
      },
      yelp: {
        reviewCount: legacy.breakdown.yelp?.reviewCount || 0,
        rating: legacy.breakdown.yelp?.rating ?? null,
        platform: 'Yelp',
      },
      amzy: {
        reviewCount: legacy.breakdown.amzy?.reviewCount || 0,
        rating: legacy.breakdown.amzy?.rating ?? null,
        platform: 'Amzy Telemetry',
      },
    },
    bbbRating: legacy.bbbRating || null,
    lastUpdated: legacy.lastUpdated,
    characterSignals: dbRep.characterSignals,
  };
}

export async function getDynamicServices() {
  return db.serviceOffering
    .findMany({
      where: { isActive: true },
      include: {
        _count: { select: { jobs: true } },
      },
      orderBy: [{ isCoreBase: 'desc' }, { createdAt: 'asc' }],
    })
    .catch(() => []);
}
