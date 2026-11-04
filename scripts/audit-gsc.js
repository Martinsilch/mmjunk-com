/**
 * M&M Junk Removal - Google Search Console Live Audit CLI
 * 
 * Interacts directly with the Google Search Console API using the service account.
 * 
 * Usage:
 *   node scripts/audit-gsc.js --queries [--limit 20] [--days 28] [--filter keyword]
 *   node scripts/audit-gsc.js --pages [--limit 20] [--days 28]
 *   node scripts/audit-gsc.js --low-ctr [--min-impressions 1]
 *   node scripts/audit-gsc.js --inspect <url>
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '..', 'google-service-account.json');
const SITE_URL = 'sc-domain:mmjunk.com';

if (!fs.existsSync(KEY_FILE)) {
  console.error(`❌ Key file not found at ${KEY_FILE}`);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
});

const searchconsole = google.searchconsole({ version: 'v1', auth });

const args = process.argv.slice(2);

function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultValue;
}

const days = parseInt(getArg('--days', '28'), 10);
const limit = parseInt(getArg('--limit', '25'), 10);
const filter = getArg('--filter', null);
const minImpressions = parseInt(getArg('--min-impressions', '1'), 10);

const today = new Date();
const startDateObj = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const formatDate = (d) => d.toISOString().split('T')[0];
const startDate = formatDate(startDateObj);
const endDate = formatDate(today);

async function runQueriesAudit() {
  console.log(`\n======================================================`);
  console.log(`  GSC SEARCH QUERIES AUDIT (${startDate} to ${endDate})`);
  console.log(`======================================================\n`);

  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 250
      }
    });

    let rows = res.data.rows || [];

    if (filter) {
      rows = rows.filter(r => r.keys[0].toLowerCase().includes(filter.toLowerCase()));
    }

    if (rows.length === 0) {
      console.log('No queries found matching criteria.');
      return;
    }

    console.log(`Total queries found: ${rows.length}\n`);
    console.log(
      'Query'.padEnd(45) +
      'Clicks'.padStart(8) +
      'Impressions'.padStart(14) +
      'CTR'.padStart(10) +
      'Position'.padStart(10)
    );
    console.log('-'.repeat(87));

    rows.slice(0, limit).forEach(r => {
      const q = r.keys[0].length > 43 ? r.keys[0].substring(0, 40) + '...' : r.keys[0];
      const clicks = r.clicks.toString();
      const impressions = r.impressions.toString();
      const ctr = (r.ctr * 100).toFixed(1) + '%';
      const pos = r.position.toFixed(1);

      console.log(
        q.padEnd(45) +
        clicks.padStart(8) +
        impressions.padStart(14) +
        ctr.padStart(10) +
        pos.padStart(10)
      );
    });

    console.log('\n');
  } catch (err) {
    console.error('❌ GSC Query Error:', err.message);
  }
}

async function runPagesAudit() {
  console.log(`\n======================================================`);
  console.log(`  GSC TOP LANDING PAGES AUDIT (${startDate} to ${endDate})`);
  console.log(`======================================================\n`);

  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit
      }
    });

    const rows = res.data.rows || [];
    if (rows.length === 0) {
      console.log('No page data found.');
      return;
    }

    console.log(
      'Landing Page'.padEnd(55) +
      'Clicks'.padStart(8) +
      'Impressions'.padStart(14) +
      'CTR'.padStart(10) +
      'Position'.padStart(10)
    );
    console.log('-'.repeat(97));

    rows.forEach(r => {
      const pagePath = r.keys[0].replace('https://www.mmjunk.com', '') || '/';
      const p = pagePath.length > 53 ? pagePath.substring(0, 50) + '...' : pagePath;
      const clicks = r.clicks.toString();
      const impressions = r.impressions.toString();
      const ctr = (r.ctr * 100).toFixed(1) + '%';
      const pos = r.position.toFixed(1);

      console.log(
        p.padEnd(55) +
        clicks.padStart(8) +
        impressions.padStart(14) +
        ctr.padStart(10) +
        pos.padStart(10)
      );
    });

    console.log('\n');
  } catch (err) {
    console.error('❌ GSC Pages Error:', err.message);
  }
}

async function runLowCtrAudit() {
  console.log(`\n======================================================`);
  console.log(`  GSC LOW-CTR & QUERY INTENT MISMATCH AUDIT`);
  console.log(`  (Queries with impressions but 0 clicks: ${startDate} to ${endDate})`);
  console.log(`======================================================\n`);

  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: 500
      }
    });

    const rows = (res.data.rows || []).filter(r => r.clicks === 0 && r.impressions >= minImpressions);

    if (rows.length === 0) {
      console.log('✓ Zero high-impression zero-click queries found.');
      return;
    }

    console.log(`Found ${rows.length} queries with 0% CTR:\n`);
    console.log(
      'Search Query'.padEnd(38) +
      'Target Page'.padEnd(36) +
      'Impr'.padStart(6) +
      'Avg Pos'.padStart(10)
    );
    console.log('-'.repeat(90));

    rows.slice(0, limit).forEach(r => {
      const query = r.keys[0].length > 36 ? r.keys[0].substring(0, 33) + '...' : r.keys[0];
      const page = r.keys[1].replace('https://www.mmjunk.com', '') || '/';
      const shortPage = page.length > 34 ? page.substring(0, 31) + '...' : page;
      const impr = r.impressions.toString();
      const pos = r.position.toFixed(1);

      console.log(
        query.padEnd(38) +
        shortPage.padEnd(36) +
        impr.padStart(6) +
        pos.padStart(10)
      );
    });

    console.log('\n');
  } catch (err) {
    console.error('❌ Low-CTR Audit Error:', err.message);
  }
}

async function inspectUrl(url) {
  let inspectionUrl = url;
  if (!inspectionUrl.startsWith('http')) {
    inspectionUrl = `https://www.mmjunk.com${url.startsWith('/') ? '' : '/'}${url}`;
  }

  console.log(`\n======================================================`);
  console.log(`  GSC LIVE URL INSPECTION: ${inspectionUrl}`);
  console.log(`======================================================\n`);

  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl,
        siteUrl: SITE_URL
      }
    });

    const r = res.data.inspectionResult;
    const s = r.indexStatusResult;

    console.log(`Verdict:           ${s.verdict === 'PASS' ? '✅ PASS (Indexed & Eligible)' : '⚠️ ' + s.verdict}`);
    console.log(`Coverage State:    ${s.coverageState}`);
    console.log(`Indexing State:    ${s.indexingState}`);
    console.log(`Robots.txt:        ${s.robotsTxtState}`);
    console.log(`Page Fetch:        ${s.pageFetchState}`);
    console.log(`Last Crawled:      ${s.lastCrawlTime || 'Never crawled'}`);
    console.log(`Crawled As:        ${s.crawledAs || 'N/A'}`);
    console.log(`User Canonical:    ${s.userCanonical || 'None declared'}`);
    console.log(`Google Canonical:  ${s.googleCanonical || 'Not assigned yet'}`);
    console.log(`Sitemaps:          ${(s.sitemap || []).join(', ') || 'Discovered without sitemap'}`);

    if (r.mobileUsabilityResult) {
      console.log(`Mobile Usability:  ${r.mobileUsabilityResult.verdict || 'N/A'}`);
    }

    if (r.richResultsResult && r.richResultsResult.detectedItems) {
      console.log(`\nStructured Data Detected:`);
      r.richResultsResult.detectedItems.forEach(item => {
        const issues = (item.items || []).flatMap(i => (i.issues || []).map(iss => iss.issueMessage));
        const status = issues.length === 0 ? '✅ Valid' : `⚠️ ${issues.join('; ')}`;
        console.log(`  - ${item.richResultType}: ${status}`);
      });
    }

    console.log('\n');
  } catch (err) {
    console.error('❌ URL Inspection Error:', err.message);
  }
}

async function main() {
  if (args.includes('--queries')) {
    await runQueriesAudit();
  } else if (args.includes('--pages')) {
    await runPagesAudit();
  } else if (args.includes('--low-ctr')) {
    await runLowCtrAudit();
  } else if (args.includes('--inspect')) {
    const url = getArg('--inspect', null);
    if (!url) {
      console.error('Please specify a URL to inspect: node scripts/audit-gsc.js --inspect <url>');
      process.exit(1);
    }
    await inspectUrl(url);
  } else {
    // Default: run quick overview
    await runQueriesAudit();
    await runLowCtrAudit();
  }
}

main();
