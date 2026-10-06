/**
 * Daily Ingestion & Review Sync Runner
 * Can be triggered locally, via task scheduler, or webhook relay
 */

require('dotenv').config();

async function runDailySync() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mmjunk.com';
  const token = process.env.YELP_WEBHOOK_SECRET || 'mmjunk-yelp-secret-2026';

  console.log(`[Daily Sync] Triggering review synchronization on ${baseUrl}...`);

  // 1. Yelp & Review Sync
  try {
    const res = await fetch(`${baseUrl}/api/webhooks/yelp?sync=true&token=${token}`);
    const json = await res.json();
    console.log(`[Daily Sync - Reviews] Status: ${res.status}`, json);
  } catch (err) {
    console.error(`[Daily Sync - Reviews Error]:`, err.message);
  }

  // 2. YouTube Video & Testimonial Sync
  const ytToken = process.env.YOUTUBE_WEBHOOK_SECRET || process.env.DISPATCH_WEBHOOK_SECRET || 'mmjunk-youtube-sync-2026';
  console.log(`[Daily Sync] Triggering YouTube video synchronization on ${baseUrl}...`);
  try {
    const resYt = await fetch(`${baseUrl}/api/sync/youtube?token=${ytToken}`);
    const jsonYt = await resYt.json();
    console.log(`[Daily Sync - YouTube] Status: ${resYt.status}`, jsonYt);
  } catch (err) {
    console.error(`[Daily Sync - YouTube Error]:`, err.message);
  }
}

runDailySync();
