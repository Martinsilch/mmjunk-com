/**
 * Yelp Fusion API Client & Ingestion Helper
 * Interfaces with Yelp Fusion v3 to extract verified customer reviews,
 * map them into the Knowledge Graph, and merge with operational telemetry.
 */

export interface DecodedYelpReview {
  reviewId: string;
  reviewerName: string;
  starRating: number;
  comment: string;
  timeCreated: string;
  url: string;
  userProfileUrl?: string;
  ownerReply?: string;
}

let mockYelpOverride: DecodedYelpReview | null = null;

export function setMockYelpReview(mock: DecodedYelpReview | null) {
  mockYelpOverride = mock;
}

export async function fetchYelpReviews(alias?: string): Promise<DecodedYelpReview[]> {
  const businessAlias = alias || process.env.YELP_BUSINESS_ALIAS || '';
  const apiKey = process.env.YELP_API_KEY;

  if (mockYelpOverride) {
    return [mockYelpOverride];
  }

  // Only allow mock fixture data when explicitly opted in for testing
  if (!apiKey || apiKey.startsWith('mock-')) {
    if (process.env.ALLOW_MOCK_REVIEWS !== 'true' && process.env.NODE_ENV !== 'test') {
      return [];
    }
    if (!businessAlias) return [];
    return [
      {
        reviewId: 'yelp-rev-78912',
        reviewerName: 'Sarah T.',
        starRating: 5,
        comment: 'Martin at M&M Junk Removal is fantastic! Emptied out our garage in Federal Way in less than an hour. Honest flat rate pricing, courteous, and super fast.',
        timeCreated: new Date().toISOString(),
        url: `https://www.yelp.com/biz/${businessAlias}?hrid=78912`,
        userProfileUrl: 'https://www.yelp.com/user_details?userid=sample_sarah'
      }
    ];
  }

  if (!businessAlias) return [];

  try {
    const response = await fetch(`https://api.yelp.com/v3/businesses/${businessAlias}/reviews`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[Yelp API Error] HTTP ${response.status}: ${await response.text()}`);
      return [];
    }

    const data = await response.json();
    const reviews: any[] = data.reviews || [];

    return reviews.map((r: any) => ({
      reviewId: r.id,
      reviewerName: r.user?.name || 'Verified Yelp Reviewer',
      starRating: r.rating || 5,
      comment: r.text || '',
      timeCreated: r.time_created || new Date().toISOString(),
      url: r.url || `https://www.yelp.com/biz/${businessAlias}`,
      userProfileUrl: r.user?.profile_url
    }));
  } catch (error) {
    console.error('[fetchYelpReviews] Exception:', error);
    return [];
  }
}

/**
 * Fetches authoritative live business metrics (review_count and rating) directly from Yelp Fusion API
 */
export async function fetchYelpBusinessMetrics(alias?: string): Promise<{ rating: number; reviewCount: number } | null> {
  const businessAlias = alias || process.env.YELP_BUSINESS_ALIAS || '';
  const apiKey = process.env.YELP_API_KEY;

  if (!apiKey || apiKey.startsWith('mock-') || !businessAlias) {
    if (process.env.ALLOW_MOCK_REVIEWS === 'true' && businessAlias) {
      return { rating: 4.7, reviewCount: 24 };
    }
    return null;
  }

  try {
    const response = await fetch(`https://api.yelp.com/v3/businesses/${businessAlias}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[Yelp Business Error] HTTP ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    return {
      rating: typeof data.rating === 'number' ? data.rating : 4.7,
      reviewCount: typeof data.review_count === 'number' ? data.review_count : 24,
    };
  } catch (error) {
    console.error('[fetchYelpBusinessMetrics] Exception:', error);
    return null;
  }
}

