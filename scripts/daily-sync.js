/**
 * Daily Ingestion & Review Sync Runner
 * Can be triggered locally, via task scheduler, or webhook relay
 */

require('dotenv').config();

async function runDailySync() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mmjunk.com';
  const token = process.env.YELP_WEBHOOK_SECRET || 'mmjunk-yelp-secret-2026';

  console.log(`[Daily Sync] Triggering review synchronization on ${baseUrl}...`);

  try {
    const res = await fetch(`${baseUrl}/api/webhooks/yelp?sync=true&token=${token}`);
    const json = await res.json();
    console.log(`[Daily Sync] Status: ${res.status}`, json);
  } catch (err) {
    console.error(`[Daily Sync Error]:`, err.message);
  }
}

runDailySync();
