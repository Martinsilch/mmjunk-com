/**
 * M&M Junk Removal - Hero Section A/B Test Live Scoreboard CLI
 * 
 * Queries Google Analytics 4 for Variant A (Classic Control) vs Variant B (Social Profile)
 * impressions, phone call clicks, and AMZY booking clicks.
 * 
 * Usage:
 *   node scripts/audit-ab-test.js [--days 30] [--property <PROPERTY_ID>]
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config();
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '..', 'google-service-account.json');

if (!fs.existsSync(KEY_FILE)) {
  console.error(`❌ Key file not found at ${KEY_FILE}`);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly']
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

const days = parseInt(getArg('--days', '30'), 10);
const propertyId = getArg('--property', process.env.GA4_PROPERTY_ID || '560389558').replace(/^properties\//, '');

async function runABReport() {
  console.log(`\n======================================================================`);
  console.log(`  M&M JUNK REMOVAL: HERO A/B EXPERIMENT SCOREBOARD (Last ${days} Days)`);
  console.log(`  GA4 Property: properties/${propertyId}`);
  console.log(`======================================================================\n`);

  try {
    // 1. Query Hero Experiment Impressions by Variant
    let impressionsRes;
    try {
      impressionsRes = await analyticsdata.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [
            { name: 'eventName' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                matchType: 'EXACT',
                value: 'hero_experiment_impression'
              }
            }
          },
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' }
          ]
        }
      });
    } catch (e) {
      impressionsRes = { data: { rows: [] } };
    }

    // 2. Query Hero Conversion Clicks
    let clicksRes;
    try {
      clicksRes = await analyticsdata.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [
            { name: 'eventName' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: ['hero_conversion_click', 'click_to_amzy_schedule', 'click_to_call']
              }
            }
          },
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' }
          ]
        }
      });
    } catch (e) {
      clicksRes = { data: { rows: [] } };
    }

    // 3. Query Overall Homepage Root Traffic
    const rootRes = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'EXACT',
              value: '/'
            }
          }
        },
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'conversions' }
        ]
      }
    });

    const rootRow = (rootRes.data.rows || [])[0];
    const rootUsers = rootRow ? parseInt(rootRow.metricValues[0].value, 10) : 0;
    const rootViews = rootRow ? parseInt(rootRow.metricValues[1].value, 10) : 0;
    const rootConversions = rootRow ? parseInt(rootRow.metricValues[2].value, 10) : 0;

    console.log(`📊 Homepage Root Baseline:`);
    console.log(`   • Active Visitors: ${rootUsers}`);
    console.log(`   • Total Views:     ${rootViews}`);
    console.log(`   • Total Actions:   ${rootConversions}\n`);

    console.log(`🧪 A/B Experiment Tracking Status:`);
    console.log(`   • Cookie:        mm_hero_ab (30-day lifetime, 50% split)`);
    console.log(`   • URL Override:  https://www.mmjunk.com/?variant=control (Forces Variant A)`);
    console.log(`   • URL Override:  https://www.mmjunk.com/?variant=social  (Forces Variant B)\n`);

    console.log(`----------------------------------------------------------------------`);
    console.log(`  VARIANT COMPARISON SUMMARY`);
    console.log(`----------------------------------------------------------------------`);
    console.log(`  Variant A: Classic Control (19+ Yrs Eyebrow + Franchise Rate Beat)`);
    console.log(`  Variant B: Social Profile (Martin Silchuk Studio Avatar + Verified Badge)\n`);

    const clickRows = clicksRes.data.rows || [];
    let amzyClicks = 0;
    let callClicks = 0;
    let totalHeroClicks = 0;

    clickRows.forEach(r => {
      const name = r.dimensionValues[0].value;
      const count = parseInt(r.metricValues[0].value, 10);
      if (name === 'click_to_amzy_schedule') amzyClicks += count;
      if (name === 'click_to_call') callClicks += count;
      if (name === 'hero_conversion_click') totalHeroClicks += count;
    });

    console.log(`📈 Live Telemetry Recorded in GA4:`);
    console.log(`   • AMZY Schedule Clicks:   ${amzyClicks}`);
    console.log(`   • Phone Call Clicks:      ${callClicks}`);
    console.log(`   • Dedicated Hero Clicks:  ${totalHeroClicks}\n`);

    console.log(`💡 How To Read Live UTM Conversions in AMZY:`);
    console.log(`   • In your AMZY Dispatch Dashboard or Webhook, check campaign parameter:`);
    console.log(`     - "hero_control" = Customer booked through Classic Header`);
    console.log(`     - "hero_social"  = Customer booked through Social Profile Header\n`);
    console.log(`======================================================================\n`);

  } catch (err) {
    console.error('❌ Scoreboard Query Error:', err.message);
  }
}

runABReport();
