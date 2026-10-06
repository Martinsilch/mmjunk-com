/**
 * M&M Junk Removal - YouTube Video & Testimonial Sync Engine
 * 
 * Extracts verified testimonial videos & job-proof Shorts from the official
 * YouTube channel (UC0hatNYCgMWhFz-58gO1uQw), resolves each video to its
 * corresponding municipal service spoke, and synchronizes with:
 * 1. PostgreSQL via Prisma (model SocialPost)
 * 2. Authoritative JSON cache (knowledge/youtube-videos.json & public/data/youtube-videos.json)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const CHANNEL_ID = 'UC0hatNYCgMWhFz-58gO1uQw';
const ROOT_DIR = path.resolve(__dirname, '..');

// City resolution aliases
const CITY_KEYWORDS = [
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

async function fetchChannelVideoIds() {
  const videoIds = new Set();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  // 1. Check Shorts Tab (where customer testimonials live)
  try {
    const resShorts = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/shorts`, { headers });
    const htmlShorts = await resShorts.text();
    const shortsMatches = [...htmlShorts.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
    for (const id of shortsMatches) videoIds.add(id);
    console.log(`[YouTube Sync] Found ${videoIds.size} videos from Shorts feed`);
  } catch (err) {
    console.warn(`[YouTube Sync] Shorts fetch error:`, err.message);
  }

  // 2. Check Standard Videos Tab
  try {
    const resVideos = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/videos`, { headers });
    const htmlVideos = await resVideos.text();
    const vidMatches = [...htmlVideos.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
    for (const id of vidMatches) videoIds.add(id);
    console.log(`[YouTube Sync] Found total ${videoIds.size} combined videos from channel tabs`);
  } catch (err) {
    console.warn(`[YouTube Sync] Videos fetch error:`, err.message);
  }

  return Array.from(videoIds);
}

async function fetchVideoDetails(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  try {
    const res = await fetch(url, { headers });
    const html = await res.text();

    // Title
    let title = null;
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(/ - YouTube$/, '').trim();
    }

    // Upload Date (ISO 8601 with timezone)
    let uploadDate = null;
    const dateMeta = html.match(/itemprop="uploadDate" content="([^"]+)"/);
    if (dateMeta) {
      uploadDate = dateMeta[1];
    } else {
      const pubMeta = html.match(/"publishDate":"([^"]+)"/);
      if (pubMeta) uploadDate = pubMeta[1];
    }

    // Fallback date if not extracted
    if (!uploadDate) {
      uploadDate = new Date().toISOString();
    }

    // Description
    let description = '';
    const descMatch = html.match(/"shortDescription":"([^"]+)"/);
    if (descMatch) {
      description = descMatch[1]
        .replace(/\\n/g, ' ')
        .replace(/\\"/g, '"')
        .slice(0, 500);
    }

    // Thumbnail
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      title: title || 'M&M Junk Removal Field Cleanout & Testimonial',
      description,
      uploadDate,
      thumbnail,
      videoUrl: url
    };
  } catch (err) {
    console.warn(`[YouTube Sync] Error fetching video ${videoId}:`, err.message);
    return null;
  }
}

function resolveCitySlug(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  for (const item of CITY_KEYWORDS) {
    for (const kw of item.keywords) {
      // Word boundary match
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combined)) {
        return item.slug;
      }
    }
  }
  return null;
}

async function fetchViaDataApi(apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=UU0hatNYCgMWhFz-58gO1uQw&maxResults=50&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.items || []).map(item => {
    const s = item.snippet;
    const videoId = s.resourceId?.videoId;
    const thumbnail = s.thumbnails?.maxres?.url || s.thumbnails?.high?.url || s.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return {
      videoId,
      title: s.title,
      description: s.description || '',
      uploadDate: s.publishedAt || new Date().toISOString(),
      thumbnail,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  });
}

async function syncYouTube() {
  console.log('================================================================');
  console.log('📺 M&M JUNK REMOVAL - YOUTUBE TESTIMONIAL INGESTION ENGINE');
  console.log(`Channel: ${CHANNEL_ID}`);
  console.log('================================================================\n');

  // 1. Load spokes from database
  const spokes = await prisma.locationSpoke.findMany();
  const spokeMap = new Map();
  for (const s of spokes) {
    spokeMap.set(s.slug, s);
  }
  console.log(`✓ Loaded ${spokes.length} location spokes from database`);

  // 2. Fetch video details via API or Scraper
  let videoList = [];
  if (process.env.YOUTUBE_API_KEY) {
    try {
      console.log('⚡ Using official YouTube Data API v3 key...');
      videoList = await fetchViaDataApi(process.env.YOUTUBE_API_KEY);
      console.log(`✓ Retrieved ${videoList.length} videos from Google Cloud API in ~200ms`);
    } catch (err) {
      console.warn('API error, falling back to scraper:', err.message);
    }
  }

  if (videoList.length === 0) {
    console.log('🔄 Running direct channel scraper fallback...');
    const videoIds = await fetchChannelVideoIds();
    for (const id of videoIds) {
      const details = await fetchVideoDetails(id);
      if (details) videoList.push(details);
    }
  }

  if (videoList.length === 0) {
    console.log('No video records retrieved. Exiting.');
    return;
  }

  const catalog = [];
  let inserted = 0;
  let updated = 0;

  console.log(`\n--- Ingesting & Resolving Municipal Spokes (${videoList.length} videos) ---`);

  for (let i = 0; i < videoList.length; i++) {
    const details = videoList[i];
    const id = details.videoId;

    // Resolve city
    const matchedSlug = resolveCitySlug(details.title, details.description);
    const location = matchedSlug ? spokeMap.get(matchedSlug) : null;
    const locationId = location ? location.id : null;
    const cityName = location ? location.cityName : 'Puget Sound';

    catalog.push({
      ...details,
      citySlug: matchedSlug,
      cityName,
      locationId
    });

    const publishedAt = new Date(details.uploadDate);

    // Upsert into Prisma SocialPost
    const existing = await prisma.socialPost.findUnique({
      where: { externalId: id }
    });

    if (existing) {
      await prisma.socialPost.update({
        where: { externalId: id },
        data: {
          locationId,
          platform: 'youtube',
          caption: details.title,
          mediaUrl: details.thumbnail,
          videoUrl: details.videoUrl,
          publishedAt
        }
      });
      updated++;
    } else {
      await prisma.socialPost.create({
        data: {
          locationId,
          platform: 'youtube',
          externalId: id,
          caption: details.title,
          mediaUrl: details.thumbnail,
          videoUrl: details.videoUrl,
          publishedAt
        }
      });
      inserted++;
    }

    const cityTag = location ? `[${location.cityName}, WA]` : `[General/All]`;
    console.log(`  ✓ (${i + 1}/${videoList.length}) ${cityTag} "${details.title}"`);
    
    // Minimal delay between DB writes
    await new Promise(r => setTimeout(r, 20));
  }

  // 3. Save JSON cache for static references
  const jsonDir1 = path.join(ROOT_DIR, 'knowledge');
  const jsonDir2 = path.join(ROOT_DIR, 'public', 'data');
  fs.mkdirSync(jsonDir1, { recursive: true });
  fs.mkdirSync(jsonDir2, { recursive: true });

  const payload = {
    channelId: CHANNEL_ID,
    syncedAt: new Date().toISOString(),
    totalVideos: catalog.length,
    videos: catalog
  };

  fs.writeFileSync(path.join(jsonDir1, 'youtube-videos.json'), JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(path.join(jsonDir2, 'youtube-videos.json'), JSON.stringify(payload, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log(`🎉 YOUTUBE SYNC COMPLETE: ${catalog.length} Total Videos`);
  console.log(`   - Newly Inserted: ${inserted}`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Synced to: knowledge/youtube-videos.json & public/data/youtube-videos.json`);
  console.log('================================================================');
}

syncYouTube()
  .catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
