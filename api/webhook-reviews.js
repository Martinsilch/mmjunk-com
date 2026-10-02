/**
 * M&M Junk Removal - Google Business Profile Reviews Webhook Endpoint (Consolidated)
 * Path: /api/webhook-reviews
 * 
 * Functions as a unified proxy & fallback for incoming GBP reviews:
 * 1. Evaluates 90-day recency qualification and exact review URLs
 * 2. Persists to assets/reviews.json (local / GitOps fallback)
 * 3. Asynchronously forwards unified telemetry payload to /api/ingest-job
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const GOOGLE_PLACE_ID = 'ChIJAcpZtwpXkFQRGSpNEcXWFt4';
const GOOGLE_MAPS_CID = '15999711673070107161';
const CANONICAL_REVIEWS_URL = `https://search.google.com/local/reviews?placeid=${GOOGLE_PLACE_ID}`;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'Martinsilch/mmjunk-com';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const MAX_RECENCY_DAYS = 90;

function parseRating(rating) {
  if (typeof rating === 'number') return rating;
  if (!rating) return 5;
  const str = String(rating).toUpperCase().trim();
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  if (map[str]) return map[str];
  const num = parseInt(str, 10);
  return isNaN(num) ? 5 : num;
}

function calculateDaysAgo(dateInput) {
  if (!dateInput) return 0;
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return 0;
  const diffMs = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function formatRelativeTime(daysAgo) {
  if (daysAgo < 1) return 'Today';
  if (daysAgo === 1) return '1 day ago';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) {
    const weeks = Math.floor(daysAgo / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (daysAgo < 365) {
    const months = Math.floor(daysAgo / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(daysAgo / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

function forwardToIngestJob(unifiedPayload, headers) {
  const host = headers?.['x-forwarded-host'] || headers?.host || 'localhost:3000';
  const proto = headers?.['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const targetUrl = `${proto}://${host}/api/ingest-job`;

  try {
    const isHttps = proto === 'https';
    const client = isHttps ? https : http;
    const parsedUrl = new URL(targetUrl);

    const req = client.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: '/api/ingest-job',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers?.['authorization'] || `Bearer ${process.env.DISPATCH_WEBHOOK_SECRET || process.env.REVIEWS_WEBHOOK_SECRET || ''}`,
        'x-webhook-secret': headers?.['x-webhook-secret'] || process.env.REVIEWS_WEBHOOK_SECRET || ''
      },
      timeout: 3000
    });

    req.on('error', () => {
      // Fire-and-forget background forwarding
    });
    req.write(JSON.stringify(unifiedPayload));
    req.end();
  } catch {
    // Non-blocking
  }
}

module.exports = async function handler(req, res) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-secret');
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : res.end();
  }

  // Handle GET - Return current reviews database status
  if (req.method === 'GET') {
    try {
      const localPath = path.join(process.cwd(), 'assets', 'reviews.json');
      let data = [];
      if (fs.existsSync(localPath)) {
        const raw = fs.readFileSync(localPath, 'utf8').replace(/^\uFEFF/, '');
        data = JSON.parse(raw);
      }
      const recent = data.filter(r => r.recencyQualified === true || (r.time && !r.time.includes('year') && !r.time.includes('month ago') || r.time.includes('1 month') || r.time.includes('2 month') || r.time.includes('3 month')));
      return res.status(200).json({
        service: 'M&M Junk Removal Google Reviews Webhook Endpoint',
        status: 'online',
        totalReviewsStored: data.length,
        recencyQualifiedCount: recent.length,
        googleRecencyCutoffDays: MAX_RECENCY_DAYS,
        canonicalReviewsUrl: CANONICAL_REVIEWS_URL,
        placeId: GOOGLE_PLACE_ID,
        cid: GOOGLE_MAPS_CID,
        unifiedEndpoint: '/api/ingest-job'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read reviews database', message: err.message });
    }
  }

  // Handle POST - Process new incoming Google review
  if (req.method === 'POST') {
    const expectedSecret = process.env.REVIEWS_WEBHOOK_SECRET;
    if (expectedSecret && req.headers) {
      const providedSecret = req.headers['x-webhook-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
      if (providedSecret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing webhook secret token' });
      }
    }

    const payload = req.body || {};
    const reviewerName = payload.name || payload.reviewerName || payload.author_name || (payload.reviewer && payload.reviewer.displayName);
    const commentText = payload.text || payload.comment || payload.reviewBody || '';
    const rating = parseRating(payload.rating || payload.starRating || 5);
    const datePublished = payload.datePublished || payload.createTime || payload.timestamp || new Date().toISOString();
    const avatar = payload.avatar || payload.profilePhotoUrl || (payload.reviewer && payload.reviewer.profilePhotoUrl) || '';
    const exactReviewUrl = payload.exactReviewUrl || payload.reviewUrl || payload.url || payload.author_url || CANONICAL_REVIEWS_URL;

    if (!reviewerName) {
      return res.status(400).json({ error: 'Missing required field: reviewer name' });
    }

    const daysAgo = calculateDaysAgo(datePublished);
    const isRecent = daysAgo <= MAX_RECENCY_DAYS;
    const timeString = payload.time || formatRelativeTime(daysAgo);

    const reviewEntry = {
      name: reviewerName,
      avatar,
      rating,
      time: timeString,
      datePublished: datePublished.split('T')[0],
      daysAgo,
      recencyQualified: isRecent,
      authorUrl: payload.authorUrl || '',
      exactReviewUrl,
      text: commentText,
      platform: 'Google',
      verified: true,
      originUrl: `https://www.google.com/maps?cid=${GOOGLE_MAPS_CID}`,
      placeId: GOOGLE_PLACE_ID
    };

    // Update local assets/reviews.json fallback
    try {
      const localPath = path.join(process.cwd(), 'assets', 'reviews.json');
      let reviews = [];
      if (fs.existsSync(localPath)) {
        const raw = fs.readFileSync(localPath, 'utf8').replace(/^\uFEFF/, '');
        reviews = JSON.parse(raw);
      }
      const existingIdx = reviews.findIndex(r => r.name.toLowerCase() === reviewerName.toLowerCase() && r.text === commentText);
      if (existingIdx >= 0) {
        reviews[existingIdx] = { ...reviews[existingIdx], ...reviewEntry };
      } else {
        reviews.unshift(reviewEntry);
      }
      fs.writeFileSync(localPath, JSON.stringify(reviews, null, 2) + '\n', 'utf8');
    } catch (fsErr) {
      console.warn('Local reviews.json update fallback notice:', fsErr.message);
    }

    // Forward to unified /api/ingest-job
    const unifiedPayload = {
      city: payload.city || 'Federal Way',
      zip: payload.zip || '98003',
      serviceType: payload.serviceType || 'Junk Removal & Hauling',
      itemCategory: payload.itemCategory || 'General Clutter & Bulky Waste',
      review: commentText,
      rating,
      customerName: reviewerName,
      reviewPlatform: 'Google',
      reviewUrl: exactReviewUrl,
      completedAt: datePublished
    };
    forwardToIngestJob(unifiedPayload, req.headers);

    return res.status(200).json({
      success: true,
      action: 'SYNCED_GOOGLE_REVIEW',
      recencyStatus: isRecent ? 'QUALIFIED_RECENT_GOOGLE_REVIEW' : 'EXCEEDS_90_DAY_THRESHOLD',
      review: reviewEntry,
      unifiedIngestForwarded: true
    });
  }
};
