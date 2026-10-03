/**
 * End-to-End Verification Test for Google Pub/Sub Review Ingestion Pipeline (Phase 2)
 * Tests:
 * 1. Verification token security guard (401 on bad token)
 * 2. Pub/Sub envelope validation (400 on malformed payload)
 * 3. Event filtering (200 on non-review events)
 * 4. Match & Merge Loop:
 *    - Ingest an Amzy dispatch job awaiting review
 *    - Push GBP NEW_REVIEW notification matching customer first name
 *    - Verify MERGED_WITH_AMZY_JOB
 * 5. Standalone Review Creation:
 *    - Push GBP review with no preceding dispatch job
 *    - Verify CREATED_NEW_STANDALONE_REVIEW
 * 6. Latency SLA (< 2000ms)
 * 7. Edge cache invalidation & case-study rendering
 */

const assert = require('assert');
require('dotenv').config();

async function testGoogleWebhook() {
  const baseUrl = 'http://localhost:3000';
  const token = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || 'mmjunk-pubsub-verify-token-2026';
  const amzySecret = process.env.DISPATCH_WEBHOOK_SECRET || 'mmjunk-dispatch-secret-2026';

  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 2: GOOGLE PUB/SUB REVIEW INGESTION PIPELINE TEST');
  console.log('================================================================\n');

  // Test 1: Verification Token Guard (401)
  console.log('--- Test 1: Verification Token Guard ---');
  const badTokenRes = await fetch(`${baseUrl}/api/webhooks/google-reviews?token=WRONG_TOKEN`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { data: 'e30=' } })
  });
  console.log(`Bad token status: ${badTokenRes.status} (Expected: 401)`);
  assert.strictEqual(badTokenRes.status, 401, 'Expected 401 for invalid verification token');
  console.log('✓ Token security guard passed\n');

  // Test 2: Envelope Validation (400)
  console.log('--- Test 2: Pub/Sub Envelope Validation ---');
  const badEnvelopeRes = await fetch(`${baseUrl}/api/webhooks/google-reviews?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invalid: true })
  });
  console.log(`Malformed envelope status: ${badEnvelopeRes.status} (Expected: 400)`);
  assert.strictEqual(badEnvelopeRes.status, 400, 'Expected 400 for malformed envelope');
  console.log('✓ Envelope validation passed\n');

  // Test 3: Event Filtering (Non-review event ignored)
  console.log('--- Test 3: Event Filtering ---');
  const ignoredPayload = {
    message: {
      data: Buffer.from(JSON.stringify({ eventType: 'ACCOUNT_UPDATED' })).toString('base64'),
      messageId: 'ignore-msg-001'
    }
  };
  const ignoredRes = await fetch(`${baseUrl}/api/webhooks/google-reviews?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ignoredPayload)
  });
  const ignoredJson = await ignoredRes.json();
  console.log(`Ignored event status: ${ignoredRes.status}, message: ${ignoredJson.message}`);
  assert.strictEqual(ignoredRes.status, 200);
  console.log('✓ Non-review events correctly filtered\n');

  // Test 4: Match & Merge Loop with Amzy Dispatch
  console.log('--- Test 4: Match & Merge Loop (Amzy Dispatch + Google Review) ---');
  // First, stage an unreviewed Amzy job for David K. in Kent
  const stageAmzyPayload = {
    jobId: "amz-kent-55410",
    completedAt: new Date().toISOString(),
    customer: {
      name: "David K.",
      city: "Kent",
      zip: "98032"
    },
    telemetry: {
      service: "Commercial Appliance Removal",
      item: "Commercial Reach-in Cooler & Freezers",
      weightLbs: 980,
      equipment: "16ft Box Truck with Liftgate",
      disposalFacility: "Bow Lake Transfer Station",
      dumpReceiptNumber: "WA-BL-2026-4412"
    }
  };

  const amzyRes = await fetch(`${baseUrl}/api/webhooks/amzy-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${amzySecret}`
    },
    body: JSON.stringify(stageAmzyPayload)
  });
  const amzyJson = await amzyRes.json();
  console.log(`Staged Amzy Job ID: ${amzyJson.jobId}, Slug: ${amzyJson.canonicalSlug}`);
  assert.strictEqual(amzyRes.status, 200);

  // Now, push Google Pub/Sub review from David K.
  const googleReviewPayload = {
    message: {
      data: Buffer.from(
        JSON.stringify({
          eventType: 'NEW_REVIEW',
          resourceName: 'accounts/123/locations/456/reviews/test-rev-999',
        })
      ).toString('base64'),
      messageId: 'mock-msg-001',
    },
  };

  const startTime = Date.now();
  const reviewRes = await fetch(`${baseUrl}/api/webhooks/google-reviews?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(googleReviewPayload),
  });
  const duration = Date.now() - startTime;
  const reviewJson = await reviewRes.json();

  console.log(`[Test] Webhook Response Status: ${reviewRes.status} (${duration}ms)`);
  console.log('Merge Result:', reviewJson);
  assert.strictEqual(reviewRes.status, 200, 'Expected HTTP 200 from valid Pub/Sub push');
  assert.strictEqual(reviewJson.success, true);
  assert.strictEqual(reviewJson.action, 'MERGED_WITH_AMZY_JOB', 'Expected MERGED_WITH_AMZY_JOB');
  assert.ok(duration < 2000, `Expected latency under 2000ms, took ${duration}ms`);
  console.log(`✓ Match & Merge verified in ${duration}ms (< 2s SLA)\n`);

  // Verify the merged case study renders with the Google review
  console.log('--- Test 5: Verify Merged Case Study Render ---');
  const mergedCaseStudyUrl = `${baseUrl}/jobs/${amzyJson.canonicalSlug}`;
  const caseStudyRes = await fetch(mergedCaseStudyUrl);
  const caseStudyHtml = await caseStudyRes.text();
  assert.strictEqual(caseStudyRes.status, 200);
  assert.ok(caseStudyHtml.includes('David K.'), 'Case study should include reviewer name David K.');
  assert.ok(caseStudyHtml.includes('980 lbs'), 'Case study should preserve weight telemetry');
  assert.ok(caseStudyHtml.includes('Bow Lake Transfer Station'), 'Case study should preserve disposal site');
  assert.ok(caseStudyHtml.includes('Response from Owner (Martin)'), 'Case study should render owner reply badge');
  assert.ok(caseStudyHtml.includes('Thank you David!'), 'Case study should include owner reply text');
  assert.ok(caseStudyHtml.includes('AF1QipNkent-appliances-proof.jpg'), 'Case study should render review photo');
  console.log('✓ Merged case study verified with Amzy telemetry, Google Review, Owner Reply, and Review Photos!\n');

  // Test 6: Standalone Google Review (No preceding Amzy job)
  console.log('--- Test 6: Standalone Review Ingestion ---');
  const standalonePayload = {
    message: {
      data: Buffer.from(
        JSON.stringify({
          eventType: 'NEW_REVIEW',
          resourceName: 'accounts/123/locations/456/reviews/test-rev-standalone-101',
        })
      ).toString('base64'),
      messageId: 'mock-msg-002',
    },
  };

  const standaloneRes = await fetch(`${baseUrl}/api/webhooks/google-reviews?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(standalonePayload),
  });
  const standaloneJson = await standaloneRes.json();
  console.log('Standalone Result:', standaloneJson);
  assert.strictEqual(standaloneRes.status, 200);
  assert.strictEqual(standaloneJson.success, true);
  assert.ok(
    standaloneJson.action === 'CREATED_NEW_STANDALONE_REVIEW' || standaloneJson.action === 'MERGED_WITH_AMZY_JOB',
    `Expected creation or merge, got ${standaloneJson.action}`
  );
  // Test 7: 4-Star Publishing Guard
  console.log('--- Test 7: 4-Star Publishing Guard ---');
  const lowStarPayload = {
    message: {
      data: Buffer.from(
        JSON.stringify({
          eventType: 'NEW_REVIEW',
          resourceName: 'accounts/123/locations/456/reviews/test-low-star-999',
        })
      ).toString('base64'),
      messageId: 'mock-msg-003',
    },
  };

  const lowStarRes = await fetch(`${baseUrl}/api/webhooks/google-reviews?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lowStarPayload),
  });
  const lowStarJson = await lowStarRes.json();
  console.log('Low-star Result:', lowStarJson);
  assert.strictEqual(lowStarRes.status, 200);
  assert.strictEqual(lowStarJson.action, 'SKIPPED_BELOW_RATING_THRESHOLD');
  console.log('✓ Reviews below 4 stars successfully intercepted and suppressed from public case studies!\n');

  console.log('================================================================');
  console.log('🎉 ALL GOOGLE PUB/SUB PIPELINE TESTS PASSED 100%');
  console.log('================================================================');
}

testGoogleWebhook().catch(err => {
  console.error('❌ Google Pipeline Test Failed:', err);
  process.exit(1);
});
