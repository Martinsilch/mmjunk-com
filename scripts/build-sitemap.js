const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.mmjunk.com';
const lastmod = '2026-10-03';

const urls = [
  // Homepage
  { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },

  // Master Service Hubs
  { loc: `${baseUrl}/services`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/residential`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/commercial`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/industrial`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/sorting-donation`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/recurring`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/contractual`, priority: '0.88', changefreq: 'weekly' },

  // Dedicated Spoke Services
  { loc: `${baseUrl}/services/commercial-appliance-removal`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/estate-cleanout`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/construction-debris-removal`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/residential-furniture-removal`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/hot-tub-demolition-removal`, priority: '0.88', changefreq: 'weekly' },
  { loc: `${baseUrl}/services/yard-waste-removal`, priority: '0.88', changefreq: 'weekly' },

  // Completed Jobs Hub & Field Telemetry Actions
  { loc: `${baseUrl}/jobs`, priority: '0.90', changefreq: 'daily' },
  { loc: `${baseUrl}/jobs/federal-way-commercial-refrigerator-extraction`, priority: '0.80', changefreq: 'monthly' },
  { loc: `${baseUrl}/jobs/ne-tacoma-moving-cleanout`, priority: '0.80', changefreq: 'monthly' },
  { loc: `${baseUrl}/jobs/federal-way-heavy-treadmill-disassembly`, priority: '0.80', changefreq: 'monthly' },
  { loc: `${baseUrl}/jobs/auburn-birch-tree-yard-waste-clearing`, priority: '0.80', changefreq: 'monthly' },
  { loc: `${baseUrl}/jobs/auburn-playset-shed-demolition`, priority: '0.80', changefreq: 'monthly' },
  { loc: `${baseUrl}/jobs/tacoma-concrete-construction-debris-removal`, priority: '0.80', changefreq: 'monthly' },

  // 25 Municipality Location Spokes
  { loc: `${baseUrl}/junk-removal-federal-way-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-auburn-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-kent-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-tacoma-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-edgewood-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-des-moines-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-milton-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-pacific-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-algona-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-covington-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-maple-valley-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-normandy-park-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-renton-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-seatac-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-tukwila-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-bonney-lake-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-fife-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-fircrest-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-gig-harbor-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-lakewood-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-puyallup-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-ruston-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-sumner-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-university-place-wa`, priority: '0.90', changefreq: 'weekly' },
  { loc: `${baseUrl}/junk-removal-south-seattle-wa`, priority: '0.90', changefreq: 'weekly' },

  // Trust & Governance
  { loc: `${baseUrl}/privacy-policy`, priority: '0.50', changefreq: 'monthly' }
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

urls.forEach(item => {
  xml += '  <url>\n';
  xml += `    <loc>${item.loc}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
  xml += `    <priority>${item.priority}</priority>\n`;
  xml += '  </url>\n';
});

xml += '</urlset>\n';

fs.writeFileSync('sitemap.xml', xml, 'utf8');
fs.writeFileSync('public/sitemap.xml', xml, 'utf8');

console.log(`Successfully generated sitemap.xml with ${urls.length} clean canonical URLs.`);
