const https = require('https');

const urls = [
  '/jobs',
  '/jobs/commercial-appliance-removal-auburn-98421',
  '/jobs/commercial-appliance-removal-federal-way-fw-cooler-0926',
  '/jobs/commercial-appliance-removal-kent-kent-55410',
  '/jobs/commercial-warehouse-pallet-cleanout-auburn-welp2m',
  '/jobs/concrete-masonry-demolition-removal-tacoma-tac-conc-0924',
  '/jobs/electronic-waste-server-rack-recycling-federal-way-3qkk5n',
  '/jobs/estate-liquidation-moving-cleanouts-tacoma-tac-move-0917',
  '/jobs/junk-removal-tacoma-yelp-standalone-1791016348567',
  '/jobs/outdoor-playset-shed-demolition-auburn-aub-demo-0922',
  '/jobs/residential-garage-cleanout-federal-way-fw-88319',
  '/jobs/residential-heavy-item-disassembly-federal-way-fw-fit-0929',
  '/jobs/residential-yard-timber-clearing-maple-valley-maple-77201',
  '/jobs/yard-waste-storm-timber-clearing-auburn-aub-yard-0920',
  '/junk-removal-algona-wa',
  '/junk-removal-auburn-wa',
  '/junk-removal-bonney-lake-wa',
  '/junk-removal-covington-wa',
  '/junk-removal-des-moines-wa',
  '/junk-removal-edgewood-wa',
  '/junk-removal-federal-way-wa',
  '/junk-removal-fife-wa',
  '/junk-removal-fircrest-wa',
  '/junk-removal-gig-harbor-wa',
  '/junk-removal-kent-wa',
  '/junk-removal-lakewood-wa',
  '/junk-removal-maple-valley-wa',
  '/junk-removal-milton-wa',
  '/junk-removal-normandy-park-wa',
  '/junk-removal-pacific-wa',
  '/junk-removal-puyallup-wa',
  '/junk-removal-renton-wa',
  '/junk-removal-ruston-wa',
  '/junk-removal-seatac-wa',
  '/junk-removal-south-seattle-wa',
  '/junk-removal-sumner-wa',
  '/junk-removal-tacoma-wa',
  '/junk-removal-tukwila-wa',
  '/junk-removal-university-place-wa',
  '/privacy-policy',
  '/services',
  '/services/commercial',
  '/services/commercial-appliance-removal',
  '/services/construction-debris-removal',
  '/services/contractual',
  '/services/estate-cleanout',
  '/services/hot-tub-demolition-removal',
  '/services/industrial',
  '/services/recurring',
  '/services/residential',
  '/services/residential-furniture-removal',
  '/services/sorting-donation',
  '/services/yard-waste-removal'
];

function fetchUrl(path) {
  return new Promise(resolve => {
    https.get('https://www.mmjunk.com' + path, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const canonicalMatch = data.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
        const canonical = canonicalMatch ? canonicalMatch[1] : 'NONE';
        const hasNoIndex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(data);
        const titleMatch = data.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'NO TITLE';
        resolve({
          path,
          status: res.statusCode,
          length: data.length,
          title: title.slice(0, 45),
          canonical,
          hasNoIndex
        });
      });
    }).on('error', err => resolve({ path, error: err.message }));
  });
}

async function run() {
  console.log('Testing all ' + urls.length + ' URLs live on https://www.mmjunk.com ...\n');
  let non200 = 0;
  let noIndexCount = 0;
  let canonicalMismatch = 0;

  for (const p of urls) {
    const res = await fetchUrl(p);
    const expectedCanonical = 'https://www.mmjunk.com' + p;
    const isCanonicalMatch = res.canonical === expectedCanonical;
    if (res.status !== 200) non200++;
    if (res.hasNoIndex) noIndexCount++;
    if (!isCanonicalMatch) canonicalMismatch++;

    const statusMark = res.status === 200 ? '✓' : '✗';
    console.log(`${statusMark} [${res.status}] ${p} (len: ${res.length}, canonical: ${res.canonical})`);
  }

  console.log('\n====================================');
  console.log('--- 53-URL LIVE AUDIT SUMMARY ---');
  console.log('Total URLs tested: ' + urls.length);
  console.log('Non-200 HTTP responses: ' + non200);
  console.log('Pages blocked by noindex: ' + noIndexCount);
  console.log('Canonical mismatches: ' + canonicalMismatch);
  console.log('====================================');
}

run();
