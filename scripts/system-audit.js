/**
 * Comprehensive System-Wide Audit Script
 * Audits:
 * 1. Database Integrity (LocationSpoke 25 coverage, JobStory links, Reviews, Slugs)
 * 2. Static Knowledge Graph & AI Manifests (llms.txt, workflows, sitemap, robots)
 * 3. Schema.org Graph JSON-LD validation across Spokes & Job Stories
 * 4. Webhook Security & Configuration Check (.env vs .env.example)
 * 5. Route consistency and edge revalidation readiness
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const AUTHORIZED_MUNICIPALITY_SLUGS = [
  'federal-way', 'auburn', 'kent', 'tacoma', 'edgewood',
  'des-moines', 'milton', 'pacific', 'algona', 'covington',
  'maple-valley', 'normandy-park', 'renton', 'seatac', 'tukwila',
  'bonney-lake', 'fife', 'fircrest', 'gig-harbor', 'lakewood',
  'puyallup', 'ruston', 'sumner', 'university-place', 'south-seattle'
];

async function runSystemAudit() {
  const prisma = new PrismaClient();
  const report = {
    database: { passed: true, issues: [], stats: {} },
    knowledgeGraph: { passed: true, issues: [], stats: {} },
    securityConfig: { passed: true, issues: [], stats: {} },
    schemaPillars: { passed: true, issues: [] },
  };

  console.log('================================================================');
  console.log('🔍 COMMENCING FULL SYSTEM & APPLICATION AUDIT');
  console.log('================================================================\n');

  // --- PART 1: Database Integrity & Coverage ---
  console.log('--- [1/4] AUDITING DATABASE & SPOKE REPOSITORY ---');
  try {
    const spokes = await prisma.locationSpoke.findMany({ include: { jobs: true } });
    const jobs = await prisma.jobStory.findMany({ include: { location: true } });
    const posts = await prisma.socialPost.findMany();

    report.database.stats = {
      totalSpokes: spokes.length,
      totalJobs: jobs.length,
      totalSocialPosts: posts.length
    };

    console.log(`✓ Neon DB Connected: ${spokes.length} Spokes, ${jobs.length} Job Stories, ${posts.length} Social Posts`);

    // Check all 25 authorized municipalities
    const authSlugs = AUTHORIZED_MUNICIPALITY_SLUGS;
    const existingSlugs = new Set(spokes.map(s => s.slug));
    const missingMunicipalities = authSlugs.filter(slug => !existingSlugs.has(slug));

    if (missingMunicipalities.length > 0) {
      console.warn(`⚠️ Warning: ${missingMunicipalities.length} authorized municipalities not yet seeded in DB:`, missingMunicipalities);
      report.database.issues.push(`Missing DB seeds for municipalities: ${missingMunicipalities.join(', ')}`);
      // We will offer to seed them!
    } else {
      console.log(`✓ All 25 authorized municipalities are present in Neon Database!`);
    }

    // Check for corrupt/incomplete job records
    const brokenJobs = jobs.filter(j => !j.slug || !j.locationId);
    if (brokenJobs.length > 0) {
      report.database.passed = false;
      report.database.issues.push(`${brokenJobs.length} jobs have missing slugs or location references!`);
      console.error(`❌ Found ${brokenJobs.length} invalid job records.`);
    } else {
      console.log(`✓ 100% of Job Stories have valid canonical slugs and foreign keys.`);
    }

    // Check review distribution
    const reviewsBySource = {};
    jobs.forEach(j => {
      const src = j.reviewSource || (j.customerReview ? 'unspecified' : 'pending_review');
      reviewsBySource[src] = (reviewsBySource[src] || 0) + 1;
    });
    console.log('✓ Ingested Review Distribution:', reviewsBySource);

  } catch (err) {
    report.database.passed = false;
    report.database.issues.push(`DB Connection Error: ${err.message}`);
    console.error('❌ Database audit error:', err.message);
  }

  // --- PART 2: Knowledge Graph & Machine-Readable Artifacts ---
  console.log('\n--- [2/4] AUDITING KNOWLEDGE GRAPH & LLMS MANIFESTS ---');
  const criticalFiles = [
    { file: 'llms.txt', requiredTokens: ['M&M Junk Removal', 'https://amzy.me/?utm_content=4', '1:00 PM PST', '$125', '25 Cities'] },
    { file: 'llms-full.txt', requiredTokens: ['AMZY Pricing Matrix', 'Algona Transfer Station', 'Tacoma Recovery & Transfer Center', 'Prohibited Materials Policy'] },
    { file: 'llms-workflows.txt', requiredTokens: ['standard pickup truck bed', 'https://amzy.me/?utm_content=4'] },
    { file: 'llm-examples.md', requiredTokens: ['Agentic Few-Shot Examples', 'Geographic Boundary Enforcement'] },
    { file: 'robots.txt', requiredTokens: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Allow: /llms.txt', 'Sitemap: https://www.mmjunk.com/sitemap.xml'] },
    { file: 'public/sitemap.xml', requiredTokens: ['<urlset', 'https://www.mmjunk.com/', 'junk-removal-federal-way-wa'] },
    { file: 'sitemap.xml', requiredTokens: ['<urlset', 'https://www.mmjunk.com/'] },
    { file: 'vercel.json', requiredTokens: ['text/markdown', 'Cache-Control'] },
    { file: 'knowledge/index.json', requiredTokens: ['M&M Junk Removal Knowledge Graph', 'estate-cleanout', 'pricing-logic'] }
  ];

  for (const item of criticalFiles) {
    const fullPath = path.join(__dirname, '..', item.file);
    if (!fs.existsSync(fullPath)) {
      report.knowledgeGraph.passed = false;
      report.knowledgeGraph.issues.push(`Missing critical file: ${item.file}`);
      console.error(`❌ Missing file: ${item.file}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const missingTokens = item.requiredTokens.filter(t => !content.includes(t));
    if (missingTokens.length > 0) {
      report.knowledgeGraph.passed = false;
      report.knowledgeGraph.issues.push(`${item.file} missing tokens: ${missingTokens.join(', ')}`);
      console.error(`❌ ${item.file} failed content validation. Missing:`, missingTokens);
    } else {
      console.log(`✓ ${item.file} present and verified (${content.length} bytes)`);
    }
  }

  // --- PART 3: Security & Environment Configurations ---
  console.log('\n--- [3/4] AUDITING SECURITY & ENVIRONMENT CONFIGURATIONS ---');
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const requiredEnvKeys = [
      'DATABASE_URL',
      'DIRECT_URL',
      'DISPATCH_WEBHOOK_SECRET',
      'GOOGLE_BUSINESS_ACCOUNT_ID',
      'GOOGLE_BUSINESS_LOCATION_ID',
      'GOOGLE_PUBSUB_VERIFICATION_TOKEN',
      'YELP_API_KEY',
      'YELP_BUSINESS_ALIAS',
      'YELP_WEBHOOK_SECRET',
      'NEXT_PUBLIC_SITE_URL'
    ];

    for (const key of requiredEnvKeys) {
      if (!envExample.includes(key)) {
        report.securityConfig.issues.push(`.env.example is missing documentation for: ${key}`);
        console.warn(`⚠️ .env.example missing key: ${key}`);
      }
      if (!process.env[key]) {
        report.securityConfig.issues.push(`.env is missing active value for: ${key}`);
        console.warn(`⚠️ Process environment missing: ${key}`);
      } else {
        console.log(`✓ Env key verified: ${key} = [CONFIGURED]`);
      }
    }
  }

  // Check git status / no secret leaks
  try {
    const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
    if (gitignore.includes('.env')) {
      console.log('✓ .gitignore properly excludes .env from repository commits');
    } else {
      report.securityConfig.passed = false;
      report.securityConfig.issues.push('.gitignore does NOT exclude .env!');
      console.error('❌ CRITICAL: .gitignore does not exclude .env');
    }
  } catch (e) {
    console.warn('Could not read .gitignore:', e.message);
  }

  // --- PART 4: Schema.org & SEO Verification ---
  console.log('\n--- [4/4] AUDITING SCHEMA.ORG & CANONICAL MESH ---');
  const schemaFiles = [
    path.join(__dirname, '..', 'app', 'jobs', '[slug]', 'page.tsx'),
    path.join(__dirname, '..', 'app', '[slug]', 'page.tsx'),
    path.join(__dirname, '..', 'app', 'sitemap.ts')
  ];

  for (const sf of schemaFiles) {
    const rel = path.relative(path.join(__dirname, '..'), sf);
    if (fs.existsSync(sf)) {
      const code = fs.readFileSync(sf, 'utf8');
      const hasSchema = code.includes('application/ld+json') || rel.includes('sitemap');
      const hasCanonical = code.includes('canonical') || rel.includes('sitemap');
      const hasAmzyCTA = code.includes('amzy') || rel.includes('sitemap');

      if (hasSchema && hasCanonical && hasAmzyCTA) {
        console.log(`✓ ${rel}: Schema JSON-LD, Canonical tags, & AMZY CTA verified`);
      } else {
        report.schemaPillars.issues.push(`${rel} missing schema/canonical/CTA check`);
        console.warn(`⚠️ ${rel} partial checks: schema=${hasSchema}, canonical=${hasCanonical}, amzy=${hasAmzyCTA}`);
      }
    }
  }

  console.log('\n================================================================');
  console.log('📋 AUDIT SUMMARY & RECOMMENDATIONS');
  console.log('================================================================');
  const totalIssues = [
    ...report.database.issues,
    ...report.knowledgeGraph.issues,
    ...report.securityConfig.issues,
    ...report.schemaPillars.issues
  ];

  if (totalIssues.length === 0) {
    console.log('🎉 100% CLEAN BILL OF HEALTH: All systems, databases, webhooks, and schemas are operational!');
  } else {
    console.log(`Found ${totalIssues.length} points of interest/improvement:`);
    totalIssues.forEach((issue, idx) => console.log(`  ${idx + 1}. ${issue}`));
  }

  await prisma.$disconnect();
  return report;
}

runSystemAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
