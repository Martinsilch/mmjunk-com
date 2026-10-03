/**
 * End-to-End Verification Test for Phase 3: Next.js Spoke Auto-Generator
 * Tests:
 * 1. Bidirectional Mesh: Spoke page contains direct links to canonical case studies
 * 2. Real-time Telemetry Injection: Jobs and reviews display on location spoke
 * 3. Auto-Synthesis for New Municipalities: Ingesting job in a new municipality generates a full spoke page
 * 4. Dynamic XML Sitemap: Verifies /sitemap.xml contains spokes and case studies
 */

const assert = require('assert');
require('dotenv').config();

async function runPhase3Tests() {
  const baseUrl = 'http://localhost:3000';
  const amzySecret = process.env.DISPATCH_WEBHOOK_SECRET || 'mmjunk-dispatch-secret-2026';

  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 3: NEXT.JS SPOKE AUTO-GENERATOR VERIFICATION');
  console.log('================================================================\n');

  // Test 1: Bidirectional Mesh Verification on Existing Spoke (Kent)
  console.log('--- Test 1: Bidirectional Mesh (Kent Spoke -> Job Stories) ---');
  const kentRes = await fetch(`${baseUrl}/junk-removal-kent-wa`);
  const kentHtml = await kentRes.text();

  assert.strictEqual(kentRes.status, 200, 'Expected 200 from Kent Spoke');
  assert.ok(kentHtml.includes('junk-removal-kent-test-rev-999'), 'Kent spoke must link to David K test review job');
  assert.ok(kentHtml.includes('commercial-appliance-removal-kent-kent-55410'), 'Kent spoke must link to appliance removal job');
  assert.ok(kentHtml.includes('David K.'), 'Kent spoke must render David K quote');
  assert.ok(kentHtml.includes('Bow Lake Transfer Station'), 'Kent spoke must render disposal site telemetry');
  console.log('✓ Bidirectional mesh verified: Kent Spoke links directly to individual job case studies!\n');

  // Test 2: Auto-Synthesis for New Municipality
  console.log('--- Test 2: Auto-Synthesis for Ingested Municipality (Maple Valley) ---');
  const mapleValleyJob = {
    jobId: "amz-maple-77201",
    completedAt: new Date().toISOString(),
    customer: {
      name: "Marcus V.",
      city: "Maple Valley",
      zip: "98038"
    },
    telemetry: {
      service: "Residential Yard Timber Clearing",
      item: "Downed Cedar Branches & Storm Debris",
      weightLbs: 1850,
      equipment: "16ft High-Wall Box Truck with Hydraulic Liftgate",
      disposalFacility: "Cedar Grove Composting Facility",
      dumpReceiptNumber: "WA-CG-2026-9021"
    },
    customerReview: "Marcus V.: Martin arrived promptly in Maple Valley and cleared out almost a ton of storm debris. Extremely fair price!",
    reviewRating: 5
  };

  const ingestRes = await fetch(`${baseUrl}/api/webhooks/amzy-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${amzySecret}`
    },
    body: JSON.stringify(mapleValleyJob)
  });
  const ingestJson = await ingestRes.json();
  console.log('Ingest Response:', ingestJson);
  assert.strictEqual(ingestRes.status, 200);

  // Now verify that /junk-removal-maple-valley-wa was synthesized dynamically
  const spokeRes = await fetch(`${baseUrl}/junk-removal-maple-valley-wa`);
  const spokeHtml = await spokeRes.text();
  console.log(`GET /junk-removal-maple-valley-wa -> Status: ${spokeRes.status}`);

  assert.strictEqual(spokeRes.status, 200, 'Expected 200 from newly synthesized spoke page');
  assert.ok(spokeHtml.includes('Maple Valley, WA'), 'Page must contain city name');
  assert.ok(spokeHtml.includes('98038'), 'Page must contain postal zone');
  assert.ok(spokeHtml.includes('1,850 lbs'), 'Page must contain telemetry weight');
  assert.ok(spokeHtml.includes('Cedar Grove Composting Facility'), 'Page must contain disposal site');
  assert.ok(spokeHtml.includes('Marcus V.'), 'Page must contain verified customer quote');
  assert.ok(spokeHtml.includes(ingestJson.canonicalSlug), 'Page must link to the new job story');
  assert.ok(spokeHtml.includes('https://schema.org'), 'Page must include valid Schema.org graph');
  console.log('✓ Spoke Auto-Synthesis verified: New city page synthesized with full telemetry & schema!\n');

  // Test 3: Dynamic XML Sitemap Verification
  console.log('--- Test 3: Dynamic Sitemap Synchronization ---');
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();

  console.log(`GET /sitemap.xml -> Status: ${sitemapRes.status}`);
  assert.strictEqual(sitemapRes.status, 200);
  assert.ok(sitemapXml.includes('/junk-removal-maple-valley-wa/'), 'Sitemap must contain Maple Valley spoke');
  assert.ok(sitemapXml.includes('/junk-removal-kent-wa/'), 'Sitemap must contain Kent spoke');
  assert.ok(sitemapXml.includes(ingestJson.canonicalSlug), 'Sitemap must contain new canonical job slug');
  console.log('✓ Dynamic sitemap verified: Contains all location spokes and job stories!\n');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 3 SPOKE AUTO-GENERATOR TESTS PASSED 100%');
  console.log('================================================================');
}

runPhase3Tests().catch(err => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
