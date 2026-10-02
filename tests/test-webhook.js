/**
 * Unit Test for M&M Junk Removal Reviews Webhook (/api/webhook-reviews)
 */

const handler = require('../api/webhook-reviews.js');

async function runTests() {
  console.log('Testing /api/webhook-reviews...\n');

  // Test 1: GET request
  let getStatus = 0;
  let getJson = null;
  const reqGet = { method: 'GET' };
  const resGet = {
    setHeader: () => {},
    status: (s) => { getStatus = s; return resGet; },
    json: (j) => { getJson = j; return resGet; },
    end: () => {}
  };

  await handler(reqGet, resGet);
  console.log('Test 1 (GET):', getStatus === 200 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('  Status:', getStatus);
  console.log('  Total Reviews Stored:', getJson.totalReviewsStored);
  console.log('  Recency Qualified (<90d):', getJson.recencyQualifiedCount);
  console.log('  Canonical URL:', getJson.canonicalReviewsUrl);

  // Test 2: POST request with a simulated recent Google review
  let postStatus = 0;
  let postJson = null;
  const reqPost = {
    method: 'POST',
    headers: {},
    body: {
      name: 'Sarah Jenkins',
      rating: 5,
      text: 'Martin came out to Federal Way within two hours of my request. Quick, efficient hot tub cut and haul away. 5-star service!',
      datePublished: new Date().toISOString(),
      exactReviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4'
    }
  };
  const resPost = {
    setHeader: () => {},
    status: (s) => { postStatus = s; return resPost; },
    json: (j) => { postJson = j; return resPost; },
    end: () => {}
  };

  await handler(reqPost, resPost);
  console.log('\nTest 2 (POST Recent Review):', postStatus === 200 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('  Action:', postJson.action);
  console.log('  Recency Status:', postJson.recencyStatus);
  console.log('  Reviewer:', postJson.review.name);
  console.log('  Days Ago:', postJson.review.daysAgo);
  console.log('  Recency Qualified:', postJson.review.recencyQualified);
  console.log('  Exact Link:', postJson.review.exactReviewUrl);

  // Test 3: POST request with a stale review (>90 days)
  let staleStatus = 0;
  let staleJson = null;
  const sixMonthsAgo = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)).toISOString();
  const reqStale = {
    method: 'POST',
    headers: {},
    body: {
      name: 'Test Stale Reviewer',
      rating: 5,
      text: 'This is an old review from 6 months ago.',
      datePublished: sixMonthsAgo
    }
  };
  const resStale = {
    setHeader: () => {},
    status: (s) => { staleStatus = s; return resStale; },
    json: (j) => { staleJson = j; return resStale; },
    end: () => {}
  };

  await handler(reqStale, resStale);
  console.log('\nTest 3 (POST Stale Review >90d):', staleStatus === 200 && staleJson.recencyStatus === 'EXCEEDS_90_DAY_THRESHOLD' ? 'PASSED ✅' : 'FAILED ❌');
  console.log('  Days Ago:', staleJson.review.daysAgo);
  console.log('  Recency Status:', staleJson.recencyStatus);
  console.log('  Recency Qualified:', staleJson.review.recencyQualified);

  // Clean up simulated test reviews from assets/reviews.json
  const fs = require('fs');
  const reviews = JSON.parse(fs.readFileSync('assets/reviews.json', 'utf8').replace(/^\uFEFF/, ''));
  const cleaned = reviews.filter(r => r.name !== 'Sarah Jenkins' && r.name !== 'Test Stale Reviewer');
  fs.writeFileSync('assets/reviews.json', JSON.stringify(cleaned, null, 2) + '\n', 'utf8');
  console.log('\nCleaned test data. Current reviews in assets/reviews.json:', cleaned.length);
}

runTests().catch(console.error);
