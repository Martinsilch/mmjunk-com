import fs from 'fs';
import path from 'path';
import fallbackReputation from '@/knowledge/reputation.json';

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

  // Persist to knowledge/reputation.json and public/knowledge/reputation.json if writable
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

  // Persist to knowledge/reputation.json and public/knowledge/reputation.json if writable
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
    console.log(`[Reputation Engine] Authoritative update: ${platform}=${reviewCount} (${rating}★) | Total=${current.reviewCount} (${current.aggregateRating}★)`);
  } catch (err) {
    console.warn('[Reputation Engine] Filesystem write skipped (read-only environment):', (err as Error).message);
  }

  return current;
}

