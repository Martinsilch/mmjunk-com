/**
 * M&M Junk Removal - Full Sitemap Indexation Audit
 * 
 * Inspects every URL in sitemap.xml against Google Search Console API.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '..', 'google-service-account.json');
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
});

const sc = google.searchconsole({ version: 'v1', auth });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const sitemapXml = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
  const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

  console.log(`Auditing ${urls.length} URLs from sitemap.xml against Google Search Console API...\n`);

  const results = {
    indexed: [],
    notIndexed: []
  };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] Inspecting ${url}... `);
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: 'sc-domain:mmjunk.com'
        }
      });

      const s = res.data.inspectionResult.indexStatusResult;
      const isIndexed = s.verdict === 'PASS';
      const record = {
        url,
        verdict: s.verdict,
        coverageState: s.coverageState,
        lastCrawlTime: s.lastCrawlTime || 'Never',
        robotsTxtState: s.robotsTxtState,
        indexingState: s.indexingState,
        googleCanonical: s.googleCanonical || 'None'
      };

      if (isIndexed) {
        results.indexed.push(record);
        console.log(`✅ INDEXED (${s.coverageState})`);
      } else {
        results.notIndexed.push(record);
        console.log(`⚠️ NOT INDEXED (${s.coverageState})`);
      }
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      results.notIndexed.push({
        url,
        verdict: 'ERROR',
        coverageState: err.message,
        lastCrawlTime: 'N/A'
      });
    }

    // Small delay to be gentle on GSC API quota
    await sleep(250);
  }

  console.log(`\n======================================================`);
  console.log(`  SUMMARY: FULL SITEMAP INDEXATION STATUS`);
  console.log(`======================================================`);
  console.log(`Total URLs:    ${urls.length}`);
  console.log(`✅ Indexed:    ${results.indexed.length} (${((results.indexed.length / urls.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️ Not Indexed: ${results.notIndexed.length} (${((results.notIndexed.length / urls.length) * 100).toFixed(1)}%)\n`);

  // Group not indexed by coverageState
  const groups = {};
  results.notIndexed.forEach(r => {
    groups[r.coverageState] = groups[r.coverageState] || [];
    groups[r.coverageState].push(r);
  });

  console.log(`Breakdown of Non-Indexed Pages by Google State:`);
  Object.keys(groups).forEach(state => {
    console.log(`\n📌 State: "${state}" (${groups[state].length} pages)`);
    groups[state].forEach(r => {
      console.log(`   - ${r.url} (Last Crawled: ${r.lastCrawlTime})`);
    });
  });

  // Save report to disk
  fs.writeFileSync(
    path.join(__dirname, '..', 'knowledge', 'gsc-indexation-report.json'),
    JSON.stringify(results, null, 2)
  );
  console.log(`\nFull report saved to knowledge/gsc-indexation-report.json\n`);
}

run().catch(console.error);
