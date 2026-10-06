import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CHANNEL_ID = 'UC0hatNYCgMWhFz-58gO1uQw';
const UPLOADS_PLAYLIST_ID = 'UU0hatNYCgMWhFz-58gO1uQw';

// Mapping rules for municipal resolution
const CITY_KEYWORDS: { slug: string; keywords: string[] }[] = [
  { slug: 'federal-way', keywords: ['federal way', 'federal-way'] },
  { slug: 'tacoma', keywords: ['tacoma', 'ne tacoma', 'northeast tacoma', 'ruston'] },
  { slug: 'auburn', keywords: ['auburn'] },
  { slug: 'kent', keywords: ['kent'] },
  { slug: 'edgewood', keywords: ['edgewood'] },
  { slug: 'milton', keywords: ['milton'] },
  { slug: 'fife', keywords: ['fife'] },
  { slug: 'des-moines', keywords: ['des moines', 'des-moines'] },
  { slug: 'puyallup', keywords: ['puyallup'] },
  { slug: 'lakewood', keywords: ['lakewood'] },
  { slug: 'bonney-lake', keywords: ['bonney lake', 'bonney-lake'] },
  { slug: 'sumner', keywords: ['sumner'] },
  { slug: 'university-place', keywords: ['university place', 'university-place'] },
  { slug: 'pacific', keywords: ['pacific'] },
  { slug: 'algona', keywords: ['algona'] },
  { slug: 'covington', keywords: ['covington'] },
  { slug: 'maple-valley', keywords: ['maple valley', 'maple-valley'] },
  { slug: 'renton', keywords: ['renton'] },
  { slug: 'seatac', keywords: ['seatac', 'sea-tac'] },
  { slug: 'tukwila', keywords: ['tukwila'] },
  { slug: 'south-seattle', keywords: ['south seattle', 'seattle'] }
];

function resolveCitySlug(title: string, description: string): string | null {
  const combined = `${title} ${description}`.toLowerCase();
  for (const item of CITY_KEYWORDS) {
    for (const kw of item.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combined)) {
        return item.slug;
      }
    }
  }
  return null;
}

interface VideoPayload {
  videoId: string;
  title: string;
  description: string;
  uploadDate: string;
  thumbnail: string;
  videoUrl: string;
}

/**
 * Strategy A: Fetch via YouTube Data API v3 (if YOUTUBE_API_KEY is provided)
 */
async function fetchViaDataApi(apiKey: string): Promise<VideoPayload[]> {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=50&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const items = data.items || [];
  return items.map((item: any) => {
    const s = item.snippet;
    const videoId = s.resourceId?.videoId;
    const thumb = s.thumbnails?.high?.url || s.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return {
      videoId,
      title: s.title,
      description: s.description || '',
      uploadDate: s.publishedAt || new Date().toISOString(),
      thumbnail: thumb,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  });
}

/**
 * Strategy B: Direct Channel Scraper Fallback (Zero-Auth, Extracts Both Shorts and Standard Videos)
 */
async function fetchViaChannelScraper(): Promise<VideoPayload[]> {
  const videoIds = new Set<string>();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  try {
    const resShorts = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/shorts`, { headers, next: { revalidate: 0 } });
    const htmlShorts = await resShorts.text();
    const shortsMatches = [...htmlShorts.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
    for (const id of shortsMatches) videoIds.add(id);
  } catch (err) {
    console.warn('Shorts tab extraction warning:', err);
  }

  try {
    const resVideos = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/videos`, { headers, next: { revalidate: 0 } });
    const htmlVideos = await resVideos.text();
    const vidMatches = [...htmlVideos.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
    for (const id of vidMatches) videoIds.add(id);
  } catch (err) {
    console.warn('Videos tab extraction warning:', err);
  }

  const results: VideoPayload[] = [];
  const idList = Array.from(videoIds).slice(0, 30);

  // Process in concurrent batches of 6 for speed and stability
  const batchSize = 6;
  for (let i = 0; i < idList.length; i += batchSize) {
    const batch = idList.slice(i, i + batchSize);
    const batchPromises = batch.map(async (id) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://www.youtube.com/watch?v=${id}`, { headers, signal: controller.signal });
        clearTimeout(timeout);
        const html = await res.text();

        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '').trim() : 'M&M Junk Removal Testimonial';

        const dateMeta = html.match(/itemprop="uploadDate" content="([^"]+)"/);
        const pubMeta = html.match(/"publishDate":"([^"]+)"/);
        const uploadDate = dateMeta ? dateMeta[1] : (pubMeta ? pubMeta[1] : new Date().toISOString());

        const descMatch = html.match(/"shortDescription":"([^"]+)"/);
        const description = descMatch ? descMatch[1].slice(0, 500) : '';

        return {
          videoId: id,
          title,
          description,
          uploadDate,
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${id}`
        };
      } catch {
        return null;
      }
    });

    const settled = await Promise.all(batchPromises);
    for (const item of settled) {
      if (item) results.push(item);
    }
  }

  return results;
}

async function handleSync(req: NextRequest) {
  // 1. Authenticate Request
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-webhook-secret');
  const urlToken = req.nextUrl.searchParams.get('token');
  const validSecrets = [
    process.env.YOUTUBE_WEBHOOK_SECRET,
    process.env.DISPATCH_WEBHOOK_SECRET,
    process.env.REVIEWS_WEBHOOK_SECRET,
    'mmjunk-youtube-sync-2026'
  ].filter(Boolean) as string[];

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const provided = bearerToken || secretHeader || urlToken;

  const isAuthorized = provided && validSecrets.includes(provided);
  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized sync request' }, { status: 401 });
  }

  try {
    // 2. Fetch video payloads
    let videos: VideoPayload[] = [];
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (apiKey) {
      try {
        videos = await fetchViaDataApi(apiKey);
      } catch (apiErr) {
        console.warn('YouTube Data API failed, falling back to direct scraper:', apiErr);
        videos = await fetchViaChannelScraper();
      }
    } else {
      videos = await fetchViaChannelScraper();
    }

    if (videos.length === 0) {
      return NextResponse.json({ success: false, message: 'No videos found on channel' }, { status: 404 });
    }

    // 3. Load location spokes
    const spokes = await db.locationSpoke.findMany();
    const spokeMap = new Map(spokes.map(s => [s.slug, s]));

    let upsertedCount = 0;
    const affectedSpokes = new Set<string>();

    for (const v of videos) {
      const citySlug = resolveCitySlug(v.title, v.description);
      const location = citySlug ? spokeMap.get(citySlug) : null;
      const locationId = location ? location.id : null;

      if (citySlug) {
        affectedSpokes.add(citySlug);
      }

      await db.socialPost.upsert({
        where: { externalId: v.videoId },
        update: {
          locationId,
          platform: 'youtube',
          caption: v.title,
          mediaUrl: v.thumbnail,
          videoUrl: v.videoUrl,
          publishedAt: new Date(v.uploadDate)
        },
        create: {
          locationId,
          platform: 'youtube',
          externalId: v.videoId,
          caption: v.title,
          mediaUrl: v.thumbnail,
          videoUrl: v.videoUrl,
          publishedAt: new Date(v.uploadDate)
        }
      });
      upsertedCount++;
    }

    // 4. Cache Revalidation
    for (const slug of affectedSpokes) {
      revalidatePath(`/junk-removal-${slug}-wa`);
      revalidatePath(`/locations/${slug}`);
    }
    revalidatePath('/');
    revalidateTag('llms-manifest');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      channelId: CHANNEL_ID,
      totalVideosProcessed: videos.length,
      upsertedCount,
      affectedSpokes: Array.from(affectedSpokes)
    });
  } catch (err: any) {
    console.error('YouTube sync error:', err);
    return NextResponse.json({ error: 'Internal sync error', details: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}
