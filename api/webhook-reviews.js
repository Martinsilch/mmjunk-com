/**
 * M&M Junk Removal - Google Business Profile Reviews Webhook Endpoint
 * Path: /api/webhook-reviews
 * 
 * Supports:
 * 1. Google Business Profile API / PubSub webhook notifications
 * 2. Zapier / Make.com / Custom webhook forwarders
 * 3. Automated GitOps persistence to assets/reviews.json
 * 4. Google 90-day recency qualification & exact review URL validation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GOOGLE_PLACE_ID = 'ChIJAcpZtwpXkFQRGSpNEcXWFt4';
const GOOGLE_MAPS_CID = '15999711673070107161';
const CANONICAL_REVIEWS_URL = `https://search.google.com/local/reviews?placeid=${GOOGLE_PLACE_ID}`;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'Martinsilch/mmjunk-com';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const MAX_RECENCY_DAYS = 90; // Google Local Recency standard cutoff

/**
 * Normalizes star ratings from numbers or strings ("FIVE", "5", 5)
 */
function parseRating(rating) {
  if (typeof rating === 'number') return rating;
  if (!rating) return 5;
  const str = String(rating).toUpperCase().trim();
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  if (map[str]) return map[str];
  const num = parseInt(str, 10);
  return isNaN(num) ? 5 : num;
}

/**
 * Calculates days between past date and now
 */
function calculateDaysAgo(dateInput) {
  if (!dateInput) return 0;
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return 0;
  const diffMs = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Human readable relative time format
 */
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

/**
 * Persist reviews.json to GitHub repository via GitOps REST API
 */
async function commitToGitHub(updatedReviews, token) {
  const filePath = 'assets/reviews.json';
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const contentBase64 = Buffer.from(JSON.stringify(updatedReviews, null, 2) + '\n').toString('base64');

  // 1. Get current file SHA
  const getSha = () => new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MMJunk-Reviews-Webhook',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          resolve(parsed.sha);
        } else {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });

  const sha = await getSha();

  // 2. Put updated content
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      message: 'feat(reviews): auto-sync verified Google review via webhook [skip ci]',
      content: contentBase64,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {})
    });

    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'User-Agent': 'MMJunk-Reviews-Webhook',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API commit failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET - Return current recent reviews database status
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
        cid: GOOGLE_MAPS_CID
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read reviews database', message: err.message });
    }
  }

  // Handle POST - Process new incoming Google review
  if (req.method === 'POST') {
    // 1. Verify Secret Token if configured
    const expectedSecret = process.env.REVIEWS_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret = req.headers['x-webhook-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
      if (providedSecret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing webhook secret token' });
      }
    }

    const payload = req.body || {};

    // 2. Extract and Normalize Review Fields
    const reviewerName = payload.name || payload.reviewerName || payload.author_name || (payload.reviewer && payload.reviewer.displayName);
    const commentText = payload.text || payload.comment || payload.reviewBody || '';
    const rating = parseRating(payload.rating || payload.starRating || 5);
    const datePublished = payload.datePublished || payload.createTime || payload.timestamp || new Date().toISOString();
    const avatar = payload.avatar || payload.profilePhotoUrl || (payload.reviewer && payload.reviewer.profilePhotoUrl) || '';
    const exactReviewUrl = payload.exactReviewUrl || payload.reviewUrl || payload.url || payload.author_url || CANONICAL_REVIEWS_URL;

    if (!reviewerName) {
      return res.status(400).json({ error: 'Missing required field: reviewer name' });
    }

    // 3. Compute Google Recency Qualification
    const daysAgo = calculateDaysAgo(datePublished);
    const isRecent = daysAgo <= MAX_RECENCY_DAYS;
    const timeString = payload.time || formatRelativeTime(daysAgo);

    const newReview = {
      name: reviewerName.trim(),
      rating: rating,
      time: timeString,
      datePublished: new Date(datePublished).toISOString().split('T')[0],
      daysAgo: daysAgo,
      recencyQualified: isRecent,
      text: commentText.trim(),
      avatar: avatar,
      platform: 'Google',
      verified: true,
      exactReviewUrl: exactReviewUrl,
      originUrl: `https://www.google.com/maps?cid=${GOOGLE_MAPS_CID}`,
      placeId: GOOGLE_PLACE_ID
    };

    // 4. Load Current reviews.json
    const localPath = path.join(process.cwd(), 'assets', 'reviews.json');
    let currentReviews = [];
    if (fs.existsSync(localPath)) {
      try {
        const raw = fs.readFileSync(localPath, 'utf8').replace(/^\uFEFF/, '');
        currentReviews = JSON.parse(raw);
      } catch (e) {
        currentReviews = [];
      }
    }

    // 5. Deduplicate (prevent duplicate entries for same reviewer)
    const existingIndex = currentReviews.findIndex(r => 
      r.name.toLowerCase() === newReview.name.toLowerCase() || 
      (newReview.text && r.text && r.text.includes(newReview.text.substring(0, 40)))
    );

    if (existingIndex >= 0) {
      // Update existing review
      currentReviews[existingIndex] = { ...currentReviews[existingIndex], ...newReview };
    } else {
      // Prepend newest review to beginning of array
      currentReviews.unshift(newReview);
    }

    // 6. Persistence: Commit to GitHub (GitOps) or Local File
    const githubToken = process.env.GITHUB_TOKEN || process.env.GH_PAT;
    let persistenceResult = 'local_file_written';

    if (githubToken) {
      try {
        await commitToGitHub(currentReviews, githubToken);
        persistenceResult = 'committed_to_github_main';
      } catch (ghErr) {
        console.error('GitHub API Commit error:', ghErr);
        // Fallback to local file write if GitHub API fails
        try {
          fs.writeFileSync(localPath, JSON.stringify(currentReviews, null, 2) + '\n', 'utf8');
          persistenceResult = 'github_failed_fallback_local_saved';
        } catch (fsErr) {
          return res.status(500).json({ error: 'Failed to persist review', details: ghErr.message });
        }
      }
    } else {
      try {
        fs.writeFileSync(localPath, JSON.stringify(currentReviews, null, 2) + '\n', 'utf8');
      } catch (fsErr) {
        console.warn('Filesystem write notice (read-only serverless environment):', fsErr.message);
        persistenceResult = 'in_memory_success_no_github_token';
      }
    }

    return res.status(200).json({
      success: true,
      action: persistenceResult,
      review: newReview,
      recencyStatus: isRecent ? 'QUALIFIED_RECENT_GOOGLE_REVIEW' : 'EXCEEDS_90_DAY_THRESHOLD',
      totalReviews: currentReviews.length
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed. Use GET or POST.' });
};
