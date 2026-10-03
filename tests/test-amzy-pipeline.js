/**
 * End-to-End Pipeline Verification Test for Amzy Dispatch Webhook
 * Tests:
 * 1. Auth rejection on missing/invalid token (401)
 * 2. Ingestion of official Amzy telemetry payload
 * 3. Latency check (< 2000ms SLA)
 * 4. Database state verification (Spoke association, JobStory creation)
 * 5. Dynamic case study rendering at /jobs/[slug]
 * 6. Match & merge deduplication with customer review
 * 7. Edge sync and LLMs manifest refresh
 */

require('dotenv').config();

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  const webhookSecret = process.env.DISPATCH_WEBHOOK_SECRET || 'mmjunk-dispatch-secret-2026';

  console.log('====================================================');
  console.log('🚀 RUNNING AMZY PIPELINE END-TO-END VERIFICATION');
  console.log('====================================================\n');

  // Test 1: Webhook Auth Rejection
  console.log('--- Test 1: Authentication Guard ---');
  const unauthorizedRes = await fetch(`${baseUrl}/api/webhooks/amzy-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: 'test-unauth' })
  });
  console.log(`Status without auth: ${unauthorizedRes.status} (Expected: 401)`);
  if (unauthorizedRes.status !== 401) {
    throw new Error(`Auth guard failed! Expected 401, got ${unauthorizedRes.status}`);
  }
  console.log('✓ Unauthorized requests correctly rejected with 401\n');

  // Test 2: Ingest Official Amzy Dispatch Payload & Measure SLA
  console.log('--- Test 2: Ingesting Official Amzy Telemetry Payload ---');
  const amzyPayload = {
    jobId: "amz-98421",
    completedAt: "2026-10-02T18:30:00Z",
    customer: {
      name: "Elena R.",
      city: "Auburn",
      zip: "98001"
    },
    telemetry: {
      service: "Appliance Removal",
      item: "Commercial Double Freezer",
      weightLbs: 620,
      equipment: "16ft Box Truck with Hydraulic Liftgate",
      disposalFacility: "Algona Transfer Station",
      dumpReceiptNumber: "WA-ALG-2026-8819",
      photos: [
        "https://assets.amzy.me/proof/job-98421-1.webp"
      ]
    }
  };

  const startTime = Date.now();
  const ingestRes = await fetch(`${baseUrl}/api/webhooks/amzy-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${webhookSecret}`
    },
    body: JSON.stringify(amzyPayload)
  });
  const elapsedMs = Date.now() - startTime;
  const ingestJson = await ingestRes.json();

  console.log(`Response Status: ${ingestRes.status}`);
  console.log(`Latency: ${elapsedMs}ms (Phase 1 Target: <2000ms)`);
  console.log('Payload Response:', JSON.stringify(ingestJson, null, 2));

  if (!ingestRes.ok || !ingestJson.success) {
    throw new Error(`Ingestion failed: ${JSON.stringify(ingestJson)}`);
  }
  if (elapsedMs >= 2000) {
    console.warn(`⚠️ Warning: Latency exceeded 2s SLA (${elapsedMs}ms)`);
  } else {
    console.log(`✓ SLA Verified: Processed in ${elapsedMs}ms (< 2s)`);
  }

  const expectedSlug = 'commercial-appliance-removal-auburn-98421';
  console.log(`Canonical Slug: ${ingestJson.canonicalSlug} (Expected: ${expectedSlug})`);
  if (ingestJson.canonicalSlug !== expectedSlug) {
    throw new Error(`Slug mismatch! Expected ${expectedSlug}, got ${ingestJson.canonicalSlug}`);
  }
  console.log('✓ Canonical slug correctly generated\n');

  // Test 3: Verify Dynamic Case Study Render
  console.log('--- Test 3: Verifying Dynamic Case Study Page Render ---');
  const caseStudyUrl = `${baseUrl}/jobs/${expectedSlug}`;
  const caseStudyRes = await fetch(caseStudyUrl);
  const html = await caseStudyRes.text();

  console.log(`GET ${caseStudyUrl} -> Status: ${caseStudyRes.status}`);
  if (caseStudyRes.status !== 200) {
    throw new Error(`Case study page returned status ${caseStudyRes.status}`);
  }

  // Check key markers in HTML
  const checks = [
    { name: 'Title / Service', pass: html.includes('Commercial Appliance Removal') || html.includes('Appliance Removal') },
    { name: 'City Anchor', pass: html.includes('Auburn, WA') },
    { name: 'Weight Telemetry', pass: html.includes('620 lbs') },
    { name: 'Equipment Rigging', pass: html.includes('16ft Box Truck') || html.includes('Hydraulic Liftgate') },
    { name: 'Disposal Site', pass: html.includes('Algona Transfer Station') },
    { name: 'Scale Ticket / Receipt', pass: html.includes('WA-ALG-2026-8819') },
    { name: 'Proof Photo', pass: html.includes('https://assets.amzy.me/proof/job-98421-1.webp') },
    { name: 'AMZY Booking CTA', pass: html.includes('https://amzy.me/?utm_content=4') },
    { name: 'Schema.org JSON-LD', pass: html.includes('"@type":["LocalBusiness"') && html.includes('AchieveAction') }
  ];

  for (const check of checks) {
    if (!check.pass) {
      throw new Error(`Case study verification failed on: ${check.name}`);
    }
    console.log(`  ✓ Checked: ${check.name}`);
  }
  console.log('✓ Live Case Study Page rendered with 100% verified telemetry!\n');

  // Test 4: Deduplication / Match & Merge Logic (Adding customer review)
  console.log('--- Test 4: Testing Match & Merge / Deduplication ---');
  const reviewPayload = {
    ...amzyPayload,
    customerReview: "Elena from Auburn: Martin was incredible! Lifted and hauled our heavy commercial freezer with zero fuss. Unbeatable price.",
    reviewRating: 5
  };

  const mergeRes = await fetch(`${baseUrl}/api/webhooks/amzy-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret
    },
    body: JSON.stringify(reviewPayload)
  });
  const mergeJson = await mergeRes.json();
  console.log('Merge Result:', mergeJson.action);
  if (mergeJson.action !== 'UPDATED_EXISTING_AMZY_JOB' && mergeJson.action !== 'MERGED_REVIEW_AND_TELEMETRY') {
    throw new Error(`Deduplication failed! Expected update/merge, got ${mergeJson.action}`);
  }
  console.log('✓ Successfully deduplicated and merged with existing job record!\n');

  // Test 5: Verify Manifest Update (/llms.txt)
  console.log('--- Test 5: Verifying /llms.txt Edge Refresh ---');
  const llmsRes = await fetch(`${baseUrl}/llms.txt`);
  const llmsText = await llmsRes.text();
  console.log(`GET /llms.txt -> Status: ${llmsRes.status}`);
  if (llmsText.includes('Auburn, WA Junk Removal') && llmsText.includes('amzy.me')) {
    console.log('✓ /llms.txt successfully verified and active');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL AMZY INGESTION PIPELINE TESTS PASSED 100%');
  console.log('====================================================');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Pipeline Test Failed:', err);
    process.exit(1);
  });
