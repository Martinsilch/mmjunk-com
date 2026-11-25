import fs from 'fs';
import path from 'path';
import fallbackReputation from '@/knowledge/reputation.json';
import { db } from '@/lib/db';

export interface ReputationPlatformBreakdown {
  reviewCount: number;
  rating: number;
  totalStars?: number;
  platform: string;
  placeId?: string;
  cid?: string;
  url?: string;
  businessAlias?: string;
}

export interface ReputationMetrics {
  aggregateRating: string;
  ratingValue: number;
  reviewCount: number;
  breakdown: {
    google: ReputationPlatformBreakdown;
    yelp: ReputationPlatformBreakdown;
    amzy: ReputationPlatformBreakdown;
  };
  bbbRating: string;
  lastUpdated: string;
}

/**
 * Retrieves the current authoritative reputation metrics.
 * Reads dynamically from disk if available, with bundled fallback.
 */
export function getReputationMetrics(): ReputationMetrics {
  try {
    const jsonPath = path.join(process.cwd(), 'knowledge', 'reputation.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
      return JSON.parse(raw) as ReputationMetrics;
    }
  } catch (err) {
    // In restricted or serverless read-only contexts, fallback to static import
    console.warn('[Reputation] Dynamic read fallback:', (err as Error).message);
  }

  return fallbackReputation as unknown as ReputationMetrics;
}

/**
 * Ingests a new review metric from a verified webhook (Google, Yelp, Amzy).
 * Incrementally updates review count, star distribution, and weighted average.
 */
export function recordReviewMetric({
  platform,
  rating,
}: {
  platform: 'google' | 'yelp' | 'amzy';
  rating: number;
}): ReputationMetrics {
  const current = getReputationMetrics();

  const plat = current.breakdown[platform] || {
    reviewCount: 0,
    rating: 5.0,
    totalStars: 0,
    platform: platform === 'google' ? 'Google Business Profile' : platform === 'yelp' ? 'Yelp' : 'Amzy Telemetry',
  };

  plat.reviewCount += 1;
  plat.totalStars = (plat.totalStars ?? (plat.reviewCount * (plat.rating || 5.0))) + rating;
  plat.rating = Number((plat.totalStars / plat.reviewCount).toFixed(1));
  current.breakdown[platform] = plat;

  // Calculate global aggregate across all platforms
  const totalReviews =
    (current.breakdown.google?.reviewCount || 0) +
    (current.breakdown.yelp?.reviewCount || 0) +
    (current.breakdown.amzy?.reviewCount || 0);

  const totalStars =
    (current.breakdown.google?.totalStars || (current.breakdown.google?.reviewCount || 0) * 5) +
    (current.breakdown.yelp?.totalStars || (current.breakdown.yelp?.reviewCount || 0) * 5) +
    (current.breakdown.amzy?.totalStars || (current.breakdown.amzy?.reviewCount || 0) * 5);

  const newAvg = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : '5.0';

  current.reviewCount = totalReviews;
  current.aggregateRating = newAvg;
  current.ratingValue = parseFloat(newAvg);
  current.lastUpdated = new Date().toISOString();

  // Persist to disk only in writable local environments (never on Vercel serverless)
  if (process.env.VERCEL !== '1') {
    try {
      const jsonStr = JSON.stringify(current, null, 2);
      const knowledgePath = path.join(process.cwd(), 'knowledge', 'reputation.json');
      const publicPath = path.join(process.cwd(), 'public', 'knowledge', 'reputation.json');

      if (fs.existsSync(path.dirname(knowledgePath))) {
        fs.writeFileSync(knowledgePath, jsonStr, 'utf8');
      }
      if (fs.existsSync(path.dirname(publicPath))) {
        fs.writeFileSync(publicPath, jsonStr, 'utf8');
      }
      console.log(`[Reputation Engine] Updated metrics: ${current.reviewCount} total reviews, ${current.aggregateRating} aggregate rating.`);
    } catch (err) {
      console.warn('[Reputation Engine] Filesystem write skipped (read-only environment):', (err as Error).message);
    }
  }

  return current;
}

/**
 * Sets authoritative live platform metrics (e.g., from direct API synchronization).
 * Recalculates total reviews, weighted star distribution, and global aggregate.
 */
export function setAuthoritativePlatformMetrics({
  platform,
  reviewCount,
  rating,
}: {
  platform: 'google' | 'yelp' | 'amzy';
  reviewCount: number;
  rating: number;
}): ReputationMetrics {
  const current = getReputationMetrics();

  const plat = current.breakdown[platform] || {
    reviewCount: 0,
    rating: 5.0,
    totalStars: 0,
    platform: platform === 'google' ? 'Google Business Profile' : platform === 'yelp' ? 'Yelp' : 'Amzy Telemetry',
  };

  plat.reviewCount = reviewCount;
  plat.rating = Number(rating.toFixed(1));
  plat.totalStars = reviewCount * rating;
  current.breakdown[platform] = plat;

  // Calculate global aggregate across all platforms
  const totalReviews =
    (current.breakdown.google?.reviewCount || 0) +
    (current.breakdown.yelp?.reviewCount || 0) +
    (current.breakdown.amzy?.reviewCount || 0);

  const totalStars =
    (current.breakdown.google?.totalStars || (current.breakdown.google?.reviewCount || 0) * 5) +
    (current.breakdown.yelp?.totalStars || (current.breakdown.yelp?.reviewCount || 0) * 4.7) +
    (current.breakdown.amzy?.totalStars || (current.breakdown.amzy?.reviewCount || 0) * 5);

  const newAvg = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : '5.0';

  current.reviewCount = totalReviews;
  current.aggregateRating = newAvg;
  current.ratingValue = parseFloat(newAvg);
  current.lastUpdated = new Date().toISOString();

  // Persist to disk only in writable local environments (never on Vercel serverless)
  if (process.env.VERCEL !== '1') {
    try {
      const jsonStr = JSON.stringify(current, null, 2);
      const knowledgePath = path.join(process.cwd(), 'knowledge', 'reputation.json');
      const publicPath = path.join(process.cwd(), 'public', 'knowledge', 'reputation.json');

      if (fs.existsSync(path.dirname(knowledgePath))) {
        fs.writeFileSync(knowledgePath, jsonStr, 'utf8');
      }
      if (fs.existsSync(path.dirname(publicPath))) {
        fs.writeFileSync(publicPath, jsonStr, 'utf8');
      }
    } catch (err) {
      console.warn('[Reputation Engine] Filesystem write skipped (read-only environment):', (err as Error).message);
    }
  }

  return current;
}

export interface CharacterSignalInput {
  dimension: string;
  label: string;
  summary: string;
  sourceType?: string;
  evidenceCount?: number;
  matchedSignals?: string[];
}

export interface ReputationWithSignals {
  reviewCount: number;
  ratingValue: number | null;
  aggregateRating: string | null;
  breakdown: {
    google: { reviewCount: number; rating: number | null; platform: string };
    yelp: { reviewCount: number; rating: number | null; platform: string };
    amzy: { reviewCount: number; rating: number | null; platform: string };
  };
  bbbRating: string | null;
  lastUpdated: string;
  characterSignals: Array<{
    dimension: string;
    label: string;
    summary: string;
    evidenceCount: number;
    sourceType: string;
  }>;
}

function emptyReputationWithSignals(): ReputationWithSignals {
  return {
    reviewCount: 0,
    ratingValue: null,
    aggregateRating: null,
    breakdown: {
      google: { reviewCount: 0, rating: null, platform: 'Google Business Profile' },
      yelp: { reviewCount: 0, rating: null, platform: 'Yelp' },
      amzy: { reviewCount: 0, rating: null, platform: 'Amzy Telemetry' },
    },
    bbbRating: null,
    lastUpdated: new Date().toISOString(),
    characterSignals: [],
  };
}

/**
 * Authoritative DB-backed reputation & contractor character read.
 * Returns zeroed Day-0 state (no fabricated ratings) if no ReputationProfile exists yet.
 */
export async function getReputationMetricsFromDb(): Promise<ReputationWithSignals> {
  try {
    const [profile, signals] = await Promise.all([
      db.reputationProfile.findUnique({ where: { id: 'primary' } }),
      db.characterSignal.findMany({ orderBy: { evidenceCount: 'desc' } }),
    ]);

    if (!profile) {
      return {
        ...emptyReputationWithSignals(),
        characterSignals: signals.map((s) => ({
          dimension: s.dimension,
          label: s.label,
          summary: s.summary,
          evidenceCount: s.evidenceCount,
          sourceType: s.sourceType,
        })),
      };
    }

    return {
      reviewCount: profile.reviewCount,
      ratingValue: profile.reviewCount > 0 ? profile.ratingValue : null,
      aggregateRating: profile.reviewCount > 0 ? profile.aggregateRating : null,
      breakdown: {
        google: { reviewCount: profile.googleCount, rating: profile.googleRating, platform: 'Google Business Profile' },
        yelp: { reviewCount: profile.yelpCount, rating: profile.yelpRating, platform: 'Yelp' },
        amzy: { reviewCount: profile.amzyCount, rating: profile.amzyRating, platform: 'Amzy Telemetry' },
      },
      bbbRating: profile.bbbRating,
      lastUpdated: profile.lastUpdated.toISOString(),
      characterSignals: signals.map((s) => ({
        dimension: s.dimension,
        label: s.label,
        summary: s.summary,
        evidenceCount: s.evidenceCount,
        sourceType: s.sourceType,
      })),
    };
  } catch (err) {
    console.warn('[Reputation DB] Read fallback to Day-0 empty state:', (err as Error).message);
    return emptyReputationWithSignals();
  }
}

/**
 * Persists an incremental verified review into Neon Postgres ReputationProfile.
 */
export async function recordReviewMetricDb({
  platform,
  rating,
}: {
  platform: 'google' | 'yelp' | 'amzy';
  rating: number;
}): Promise<ReputationWithSignals> {
  const existing = await db.reputationProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);

  let googleCount = existing?.googleCount ?? 0;
  let googleStars = (existing?.googleCount ?? 0) * (existing?.googleRating ?? 0);
  let yelpCount = existing?.yelpCount ?? 0;
  let yelpStars = (existing?.yelpCount ?? 0) * (existing?.yelpRating ?? 0);
  let amzyCount = existing?.amzyCount ?? 0;
  let amzyStars = (existing?.amzyCount ?? 0) * (existing?.amzyRating ?? 0);

  if (platform === 'google') {
    googleCount += 1;
    googleStars += rating;
  } else if (platform === 'yelp') {
    yelpCount += 1;
    yelpStars += rating;
  } else {
    amzyCount += 1;
    amzyStars += rating;
  }

  const googleRating = googleCount > 0 ? Number((googleStars / googleCount).toFixed(2)) : null;
  const yelpRating = yelpCount > 0 ? Number((yelpStars / yelpCount).toFixed(2)) : null;
  const amzyRating = amzyCount > 0 ? Number((amzyStars / amzyCount).toFixed(2)) : null;

  const totalCount = googleCount + yelpCount + amzyCount;
  const totalStars = googleStars + yelpStars + amzyStars;
  const avgNum = totalCount > 0 ? Number((totalStars / totalCount).toFixed(1)) : null;
  const avgStr = avgNum !== null ? avgNum.toFixed(1) : null;

  await db.reputationProfile.upsert({
    where: { id: 'primary' },
    create: {
      id: 'primary',
      reviewCount: totalCount,
      ratingValue: avgNum,
      aggregateRating: avgStr,
      googleCount,
      googleRating,
      yelpCount,
      yelpRating,
      amzyCount,
      amzyRating,
      bbbRating: existing?.bbbRating ?? null,
      lastUpdated: new Date(),
    },
    update: {
      reviewCount: totalCount,
      ratingValue: avgNum,
      aggregateRating: avgStr,
      googleCount,
      googleRating,
      yelpCount,
      yelpRating,
      amzyCount,
      amzyRating,
      lastUpdated: new Date(),
    },
  });

  // Also keep sync fallback JSON updated in local writable dev
  recordReviewMetric({ platform, rating });
  return getReputationMetricsFromDb();
}

/**
 * Sets authoritative platform metrics (Google / Yelp / Amzy sync) in Neon Postgres.
 */
export async function setAuthoritativePlatformMetricsDb({
  platform,
  reviewCount,
  rating,
}: {
  platform: 'google' | 'yelp' | 'amzy';
  reviewCount: number;
  rating: number;
}): Promise<ReputationWithSignals> {
  const existing = await db.reputationProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);

  const googleCount = platform === 'google' ? reviewCount : (existing?.googleCount ?? 0);
  const googleRating = platform === 'google' ? (reviewCount > 0 ? rating : null) : (existing?.googleRating ?? null);
  const yelpCount = platform === 'yelp' ? reviewCount : (existing?.yelpCount ?? 0);
  const yelpRating = platform === 'yelp' ? (reviewCount > 0 ? rating : null) : (existing?.yelpRating ?? null);
  const amzyCount = platform === 'amzy' ? reviewCount : (existing?.amzyCount ?? 0);
  const amzyRating = platform === 'amzy' ? (reviewCount > 0 ? rating : null) : (existing?.amzyRating ?? null);

  const totalCount = googleCount + yelpCount + amzyCount;
  const totalStars =
    googleCount * (googleRating ?? 0) +
    yelpCount * (yelpRating ?? 0) +
    amzyCount * (amzyRating ?? 0);
  const avgNum = totalCount > 0 ? Number((totalStars / totalCount).toFixed(1)) : null;
  const avgStr = avgNum !== null ? avgNum.toFixed(1) : null;

  await db.reputationProfile.upsert({
    where: { id: 'primary' },
    create: {
      id: 'primary',
      reviewCount: totalCount,
      ratingValue: avgNum,
      aggregateRating: avgStr,
      googleCount,
      googleRating,
      yelpCount,
      yelpRating,
      amzyCount,
      amzyRating,
      bbbRating: existing?.bbbRating ?? null,
      lastUpdated: new Date(),
    },
    update: {
      reviewCount: totalCount,
      ratingValue: avgNum,
      aggregateRating: avgStr,
      googleCount,
      googleRating,
      yelpCount,
      yelpRating,
      amzyCount,
      amzyRating,
      lastUpdated: new Date(),
    },
  });

  setAuthoritativePlatformMetrics({ platform, reviewCount, rating });
  return getReputationMetricsFromDb();
}

/**
 * Merges AMZY-verified contractor character signals into Neon Postgres.
 */
export async function upsertCharacterSignalsDb(signals: CharacterSignalInput[] = []): Promise<void> {
  if (!Array.isArray(signals) || signals.length === 0) return;

  for (const sig of signals) {
    if (!sig?.dimension || !sig?.label || !sig?.summary) continue;
    const existing = await db.characterSignal.findUnique({ where: { dimension: sig.dimension } }).catch(() => null);
    if (existing) {
      const mergedMatched = Array.from(new Set([...(existing.matchedSignals || []), ...(sig.matchedSignals || [])])).slice(0, 25);
      await db.characterSignal.update({
        where: { dimension: sig.dimension },
        data: {
          label: sig.label,
          summary: sig.summary,
          evidenceCount: existing.evidenceCount + (sig.evidenceCount || 1),
          matchedSignals: mergedMatched,
        },
      });
    } else {
      await db.characterSignal.create({
        data: {
          dimension: sig.dimension,
          label: sig.label,
          summary: sig.summary,
          evidenceCount: sig.evidenceCount || 1,
          sourceType: sig.sourceType || 'job_telemetry',
          matchedSignals: sig.matchedSignals || [],
        },
      });
    }
  }
}

