/**
 * M&M Junk Removal - Google Analytics 4 (GA4) Live Audit CLI
 * 
 * Queries GA4 traffic, active users, page views, and conversion events.
 * 
 * Usage:
 *   node scripts/audit-ga4.js [--days 28] [--property <PROPERTY_ID>]
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '..', 'google-service-account.json');

if (!fs.existsSync(KEY_FILE)) {
  console.error(`❌ Key file not found at ${KEY_FILE}`);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly'
  ]
});

const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultValue;
}

const days = parseInt(getArg('--days', '28'), 10);
let propertyId = getArg('--property', process.env.GA4_PROPERTY_ID || null);

async function runReport(propId) {
  const cleanId = propId.replace(/^properties\//, '');
  console.log(`\n======================================================`);
  console.log(`  GA4 TRAFFIC & CONVERSIONS AUDIT (Last ${days} Days)`);
  console.log(`  Property: properties/${cleanId}`);
  console.log(`======================================================\n`);

  try {
    const res = await analyticsdata.properties.runReport({
      property: `properties/${cleanId}`,
      requestBody: {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'averageSessionDuration' }
        ],
        limit: 25
      }
    });

    const rows = res.data.rows || [];
    if (rows.length === 0) {
      console.log('No analytics data recorded for this time range.');
      return;
    }

    console.log(
      'Page Path'.padEnd(45) +
      'Active Users'.padStart(14) +
      'Page Views'.padStart(12) +
      'Conversions'.padStart(14) +
      'Avg Duration'.padStart(14)
    );
    console.log('-'.repeat(99));

    rows.forEach(r => {
      const page = r.dimensionValues[0].value;
      const shortPage = page.length > 43 ? page.substring(0, 40) + '...' : page;
      const users = r.metricValues[0].value;
      const views = r.metricValues[1].value;
      const conv = r.metricValues[2].value;
      const dur = parseFloat(r.metricValues[3].value).toFixed(1) + 's';

      console.log(
        shortPage.padEnd(45) +
        users.padStart(14) +
        views.padStart(12) +
        conv.padStart(14) +
        dur.padStart(14)
      );
    });

    console.log('\n');
  } catch (err) {
    console.error('❌ GA4 Query Error:', err.message);
  }
}

async function main() {
  if (propertyId) {
    await runReport(propertyId);
    return;
  }

  // Attempt auto-discovery via admin API
  try {
    const admin = google.analyticsadmin({ version: 'v1beta', auth });
    const accRes = await admin.accountSummaries.list();
    const summaries = accRes.data.accountSummaries || [];
    if (summaries.length > 0 && summaries[0].propertySummaries && summaries[0].propertySummaries.length > 0) {
      const discovered = summaries[0].propertySummaries[0].property;
      console.log(`✓ Auto-detected GA4 property: ${discovered}`);
      await runReport(discovered);
      return;
    }
  } catch (e) {
    // Admin API not enabled or not accessible
  }

  console.log(`\n======================================================`);
  console.log(`  GA4 SETUP: PROPERTY ID REQUIRED`);
  console.log(`======================================================\n`);
  console.log(`To run GA4 reports, provide your 9-digit numeric Property ID:`);
  console.log(`  node scripts/audit-ga4.js --property <YOUR_NUMERIC_PROPERTY_ID>`);
  console.log(`\nWhere to find it:`);
  console.log(`  1. Go to https://analytics.google.com/`);
  console.log(`  2. Click Admin (bottom-left gear icon) > Property Details`);
  console.log(`  3. In the top-right corner, copy the "PROPERTY ID" (e.g. 345678912)`);
  console.log(`\nTip: You can also save it in .env.local as GA4_PROPERTY_ID=123456789\n`);
}

main();
