/**
 * Sitemap Synchronization Utility
 * Generates canonical XML sitemap incorporating:
 * - Master domain & service pillars
 * - All 25 authorized municipality location spokes
 * - All canonical job story case studies from Prisma
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function generateSitemap() {
  const prisma = new PrismaClient();
  const baseUrl = 'https://www.mmjunk.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/services/`, priority: '0.90', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/residential/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/commercial/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/industrial/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/sorting-donation/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/recurring/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/contractual/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/commercial-appliance-removal/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/estate-cleanout/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/construction-debris-removal/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/residential-furniture-removal/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/hot-tub-demolition-removal/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/services/yard-waste-removal/`, priority: '0.88', changefreq: 'weekly' },
    { loc: `${baseUrl}/jobs/`, priority: '0.90', changefreq: 'daily' }
  ];

  // 25 Municipalities
  const MUNICIPALITIES = [
    'federal-way', 'auburn', 'kent', 'tacoma', 'edgewood',
    'des-moines', 'milton', 'pacific', 'algona', 'covington',
    'maple-valley', 'normandy-park', 'renton', 'seatac', 'tukwila',
    'bonney-lake', 'fife', 'fircrest', 'gig-harbor', 'lakewood',
    'puyallup', 'ruston', 'sumner', 'university-place', 'south-seattle'
  ];

  // Fetch spokes and jobs from database
  let dbSpokes = [];
  let dbJobs = [];
  try {
    dbSpokes = await prisma.locationSpoke.findMany({ select: { slug: true } });
    dbJobs = await prisma.jobStory.findMany({
      where: { slug: { not: null } },
      select: { slug: true, completedAt: true }
    });
  } catch (e) {
    console.warn('DB query error during sitemap generation:', e.message);
  } finally {
    await prisma.$disconnect();
  }

  const allSpokeSlugs = new Set([...MUNICIPALITIES, ...dbSpokes.map(s => s.slug)]);
  const spokeUrls = Array.from(allSpokeSlugs).map(slug => ({
    loc: `${baseUrl}/junk-removal-${slug}-wa/`,
    priority: '0.90',
    changefreq: 'weekly'
  }));

  // Legacy static jobs
  const legacyJobs = [
    'federal-way-commercial-refrigerator-extraction',
    'ne-tacoma-moving-cleanout',
    'federal-way-heavy-treadmill-disassembly',
    'auburn-birch-tree-yard-waste-clearing',
    'auburn-playset-shed-demolition',
    'tacoma-concrete-construction-debris-removal'
  ];

  const allJobSlugs = new Set([...legacyJobs, ...dbJobs.map(j => j.slug)]);
  const jobUrls = Array.from(allJobSlugs).map(slug => ({
    loc: `${baseUrl}/jobs/${slug}/`,
    priority: '0.80',
    changefreq: 'monthly'
  }));

  const xmlEntries = [...staticUrls, ...spokeUrls, ...jobUrls]
    .map(entry => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`)
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

  // Write to root (for audit-pillars test)
  const rootPath = path.join(process.cwd(), 'sitemap.xml');
  fs.writeFileSync(rootPath, sitemapXml, 'utf8');

  // Write to public/sitemap.xml (for Next.js static asset serving)
  const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemapXml, 'utf8');

  console.log(`✓ Sitemap generated: ${staticUrls.length + spokeUrls.length + jobUrls.length} URLs written to root and public sitemap.xml`);
}

if (require.main === module) {
  generateSitemap().catch(console.error);
}

module.exports = { generateSitemap };
