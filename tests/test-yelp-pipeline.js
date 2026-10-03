/**
 * End-to-End Verification Test for Yelp Review Ingestion Pipeline
 * Tests:
 * 1. Webhook Secret Guard (401 on unauthorized requests)
 * 2. Match & Merge with Amzy Dispatch (Sarah T. in Federal Way)
 * 3. Standalone Yelp Review Ingestion & Spoke Resolution (Tacoma)
 * 4. Case Study Page Rendering with Yelp Badges & Attribution
 * 5. Latency SLA (< 2000ms)
 */

const assert = require('assert');
require('dotenv').config();

async function testYelpPipeline() {
  const baseUrl = 'http://localhost:3000';
  const yelpSecret = process.env.YELP_WEBHOOK_SECRET || 'mmjunk-yelp-secret-2026';
  const amzySecret = process.env.DISPATCH_WEBHOOK_SECRET || 'mmjunk-dispatch-secret-2026';

  console.log('================================================================');
  console.log('🚀 RUNNING YELP REVIEW INGESTION PIPELINE VERIFICATION');
  console.log('================================================================\n');

  // Test 1: Authentication Guard
  console.log('--- Test 1: Authentication Guard ---');
  const badAuthRes = await fetch(`${baseUrl}/api/webhooks/yelp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewId: 'unauth-test' })
  });
  console.log(`Unauthorized status: ${badAuthRes.status} (Expected: 401)`);
  assert.strictEqual(badAuthRes.status, 401);
  console.log('✓ Unauthorized Yelp requests correctly rejected with 401\n');

  // Test 2: Match & Merge Loop with Amzy Dispatch
  console.log('--- Test 2: Match & Merge (Amzy Job + Yelp Review) ---');
  // Stage an unreviewed Amzy job for Sarah T. in Federal Way
  const stageAmzy = {
    jobId: "amz-fw-88319",
    completedAt: new Date().toISOString(),
    customer: {
      name: "Sarah T.",
      city: "Federal Way",
      zip: "98003"
    },
    telemetry: {
      service: "Residential Garage Cleanout",
      item: "Garage Clutter & Heavy Workbench",
      weightLbs: 1120,
      equipment: "16ft Box Truck with Hydraulic Liftgate",
      disposalFacility: "Bow Lake Transfer Station",
      dumpReceiptNumber: "WA-BL-2026-7719"
    }
  };

  const amzyRes = await fetch(`${baseUrl}/api/webhooks/amzy-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${amzySecret}`
    },
    body: JSON.stringify(stageAmzy)
  });
  const amzyJson = await amzyRes.json();
  console.log(`Staged Amzy Job ID: ${amzyJson.jobId}, Slug: ${amzyJson.canonicalSlug}`);
  assert.strictEqual(amzyRes.status, 200);

  // Ingest matching Yelp review
  const yelpPayload = {
    reviewId: "yelp-rev-sarah-883",
    rating: 5,
    text: "Martin at M&M Junk Removal is fantastic! Emptied out our garage in Federal Way in less than an hour. Honest flat rate pricing, courteous, and super fast.",
    reviewerName: "Sarah T.",
    url: "https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3?hrid=sarah883",
    timeCreated: new Date().toISOString()
  };

  const startTime = Date.now();
  const yelpRes = await fetch(`${baseUrl}/api/webhooks/yelp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yelpSecret}`
    },
    body: JSON.stringify(yelpPayload)
  });
  const duration = Date.now() - startTime;
  const yelpJson = await yelpRes.json();

  console.log(`[Test] Webhook Status: ${yelpRes.status} (${duration}ms)`);
  console.log('Yelp Ingestion Result:', yelpJson);
  assert.strictEqual(yelpRes.status, 200);
  assert.strictEqual(yelpJson.success, true);
  assert.ok(duration < 2000, `Latency exceeded 2s SLA (${duration}ms)`);
  console.log(`✓ Match & Merge verified in ${duration}ms (< 2s SLA)\n`);

  // Verify the merged case study page
  console.log('--- Test 3: Verifying Merged Case Study Render ---');
  const caseStudyUrl = `${baseUrl}/jobs/${amzyJson.canonicalSlug}`;
  const caseStudyRes = await fetch(caseStudyUrl);
  const html = await caseStudyRes.text();

  assert.strictEqual(caseStudyRes.status, 200);
  assert.ok(html.includes('Sarah T.'), 'Case study must render reviewer Sarah T.');
  assert.ok(html.includes('1,120 lbs'), 'Case study must preserve 1,120 lbs weight');
  assert.ok(html.includes('Bow Lake Transfer Station'), 'Case study must preserve disposal route');
  assert.ok(html.includes('Yelp'), 'Case study must attribute Yelp source');
  console.log('✓ Merged case study verified with Yelp attribution & Amzy telemetry!\n');

  // Test 4: Standalone Yelp Review (Tacoma)
  console.log('--- Test 4: Standalone Yelp Review Ingestion (Tacoma) ---');
  const standaloneYelp = {
    reviewId: `yelp-standalone-${Date.now()}`,
    rating: 5,
    text: "Called Martin for a commercial store fixture cleanup in Tacoma. Arrived with his big 16ft box truck and hauled everything in 30 minutes. 5 stars all the way!",
    reviewerName: "Jason P.",
    url: "https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3",
    timeCreated: new Date().toISOString()
  };

  const standaloneRes = await fetch(`${baseUrl}/api/webhooks/yelp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': yelpSecret
    },
    body: JSON.stringify(standaloneYelp)
  });
  const standaloneJson = await standaloneRes.json();
  console.log('Standalone Result:', standaloneJson);
  assert.strictEqual(standaloneRes.status, 200);
  assert.strictEqual(standaloneJson.success, true);
  assert.strictEqual(standaloneJson.reviews[0].location, 'tacoma');
  console.log('✓ Standalone Yelp review successfully resolved to Tacoma spoke!\n');

  // Test 5: GET /api/webhooks/yelp?sync=true
  console.log('--- Test 5: GET Scheduled Sync Endpoint ---');
  const unauthSyncRes = await fetch(`${baseUrl}/api/webhooks/yelp?sync=true`);
  console.log(`Unauthenticated sync status: ${unauthSyncRes.status} (Expected: 401)`);
  assert.strictEqual(unauthSyncRes.status, 401);

  const authSyncRes = await fetch(`${baseUrl}/api/webhooks/yelp?sync=true&token=${yelpSecret}`);
  console.log(`Authenticated sync status: ${authSyncRes.status} (Expected: 200)`);
  assert.strictEqual(authSyncRes.status, 200);
  const syncJson = await authSyncRes.json();
  console.log('Sync Result:', syncJson);
  assert.strictEqual(syncJson.success, true);
  assert.strictEqual(syncJson.status, 'SYNC_COMPLETED');
  console.log('✓ Scheduled Yelp review sync verified via GET endpoint!\n');

  // Test 6: 4-Star Publishing Guard & Owner Reply
  console.log('--- Test 6: 4-Star Publishing Guard & Owner Reply ---');
  const lowRatingYelp = {
    reviewId: `yelp-low-rating-${Date.now()}`,
    rating: 2,
    text: "Martin was busy today and couldn't come immediately. Call 253-555-9999 or email test@example.com for info.",
    reviewerName: "Angry User",
    url: "https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3",
    timeCreated: new Date().toISOString()
  };

  const lowRatingRes = await fetch(`${baseUrl}/api/webhooks/yelp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': yelpSecret
    },
    body: JSON.stringify(lowRatingYelp)
  });
  const lowRatingJson = await lowRatingRes.json();
  console.log('Low Rating Result:', lowRatingJson);
  assert.strictEqual(lowRatingRes.status, 200);
  assert.strictEqual(lowRatingJson.reviews[0].action, 'SKIPPED_BELOW_RATING_THRESHOLD');
  console.log('✓ Reviews below 4 stars successfully suppressed from public case studies!\n');

  console.log('================================================================');
  console.log('🎉 ALL YELP INGESTION PIPELINE TESTS PASSED 100%');
  console.log('================================================================');
}

testYelpPipeline().catch(err => {
  console.error('❌ Yelp Pipeline Test Failed:', err);
  process.exit(1);
});
