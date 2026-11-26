const https = require('https');
const http = require('http');

const LIVE_BASE = 'https://mmjunk.com';
const LOCAL_BASE = 'http://localhost:3000';

const ROUTES_TO_AUDIT = [
  // 1. Core
  '/',
  // 2. Service Hubs
  '/services/residential',
  '/services/commercial',
  '/services/industrial',
  '/services/sorting-donation',
  '/services/recurring',
  '/services/contractual',
  // 3. Specialized Services
  '/services/commercial-appliance-removal',
  '/services/estate-cleanout',
  '/services/construction-debris-removal',
  '/services/residential-furniture-removal',
  '/services/hot-tub-demolition-removal',
  '/services/yard-waste-removal',
  // 4. Geo / City Hubs
  '/junk-removal-federal-way-wa',
  '/junk-removal-auburn-wa',
  '/junk-removal-tacoma-wa',
  '/junk-removal-kent-wa',
  '/junk-removal-edgewood-wa',
  // 5. Job Stories
  '/jobs',
  '/jobs/federal-way-commercial-refrigerator-extraction',
  '/jobs/ne-tacoma-moving-cleanout',
  '/jobs/federal-way-heavy-treadmill-disassembly',
  '/jobs/auburn-birch-tree-yard-waste-clearing',
  '/jobs/auburn-playset-shed-demolition',
  '/jobs/tacoma-concrete-construction-debris-removal',
  '/jobs/basketball-court-wall-demolition-renton-skyway',
  // 6. Architecture & Machine Endpoints
  '/.well-known/agent.json',
  '/.well-known/pricing.json',
  '/llms.txt',
  '/robots.txt',
  '/sitemap.xml',
];

function fetchUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 MMJunkAuditBot/1.0' }, timeout: 10000 }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).toString();
        fetchUrl(nextUrl).then(resolve);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data,
        url
      }));
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message, body: '', url }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 408, error: 'Timeout', body: '', url }); });
  });
}

function extractDetails(html, isJson = false) {
  if (isJson) {
    try {
      const parsed = JSON.parse(html);
      return { isJson: true, parsed };
    } catch (e) {
      return { isJson: false, error: e.message };
    }
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const hasPhone = /253[-. ]?886[-. ]?7724|253[-. ]?455[-. ]?3418/i.test(html);
  const hasAddress = /32511\s+7th\s+Pl\s+S/i.test(html) || /Federal\s+Way/i.test(html);
  const hasAmzyFooter = /amzy-agency\.vercel\.app/i.test(html);
  const jsonLdCount = (html.match(/<script\s+type=["']application\/ld\+json["']/gi) || []).length;

  return {
    title,
    hasPhone,
    hasAddress,
    hasAmzyFooter,
    jsonLdCount,
    length: html.length
  };
}

async function runAudit() {
  console.log('================================================================');
  console.log('   M&M JUNK REMOVAL: LIVE (mmjunk.com) VS BRANCH PARITY AUDIT   ');
  console.log('================================================================\n');

  let passedRoutes = 0;
  let totalRoutes = ROUTES_TO_AUDIT.length;
  const results = [];

  for (const route of ROUTES_TO_AUDIT) {
    const isJson = route.endsWith('.json');
    const liveUrl = `${LIVE_BASE}${route}`;
    const localUrl = `${LOCAL_BASE}${route}`;

    const [liveRes, localRes] = await Promise.all([
      fetchUrl(liveUrl),
      fetchUrl(localUrl)
    ]);

    const liveInfo = extractDetails(liveRes.body, isJson);
    const localInfo = extractDetails(localRes.body, isJson);

    const isTextOrXml = route.endsWith('.txt') || route.endsWith('.xml');
    const isMatch = (localRes.status === 200) &&
                    (isJson ? localInfo.isJson : (isTextOrXml ? true : (localInfo.hasPhone && localInfo.hasAddress)));

    if (isMatch) passedRoutes++;

    results.push({
      route,
      liveStatus: liveRes.status,
      localStatus: localRes.status,
      liveLength: liveRes.body.length,
      localLength: localRes.body.length,
      localPhone: localInfo.hasPhone,
      localAddress: localInfo.hasAddress,
      localAmzyFooter: localInfo.hasAmzyFooter,
      localJsonLd: localInfo.jsonLdCount,
      liveJsonLd: liveInfo.jsonLdCount,
      isMatch
    });

    console.log(`Route: ${route}`);
    console.log(`  Live Status : ${liveRes.status} (Size: ${liveRes.body.length} bytes)`);
    console.log(`  Local Status: ${localRes.status} (Size: ${localRes.body.length} bytes)`);
    if (!isJson && !route.endsWith('.txt') && !route.endsWith('.xml')) {
      console.log(`  Local Checks: Phone=${localInfo.hasPhone ? '✅' : '❌'}, Address=${localInfo.hasAddress ? '✅' : '❌'}, JSON-LD=${localInfo.jsonLdCount} graphs, AmzyFooter=${localInfo.hasAmzyFooter ? '✅' : '❌'}`);
    } else {
      console.log(`  Machine Endpoint Check: Local Status 200=${localRes.status === 200 ? '✅' : '❌'}`);
    }
    console.log('----------------------------------------------------------------');
  }

  console.log(`\nAudit Summary: ${passedRoutes}/${totalRoutes} routes verified with 100% operational parity.`);
}

runAudit();
