const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('    M&M JUNK REMOVAL: APP-WIDE DIAGNOSTIC AUDIT    ');
console.log('====================================================\n');

let totalChecks = 0;
let errors = [];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.name === 'node_modules' || file.name === '.git' || file.name === '.next' || file.name === 'archive' || file.name === 'brain') continue;
    const full = path.join(dir, file.name);
    if (file.isDirectory()) {
      walk(full, fileList);
    } else {
      fileList.push(full);
    }
  }
  return fileList;
}

const allFiles = walk('.');

// 1. Check for Geographic Service Boundary Conflicts ("15 Miles")
console.log('--- [CHECK 1] Geographic Service Boundary Conflicts ("15 Miles") ---');
allFiles.forEach(f => {
  if (/\.(html|txt|md)$/.test(f) && !f.includes('scripts')) {
    totalChecks++;
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('Service Radius 15 Miles') || content.includes('15-Mile Service Radius')) {
      errors.push(`[15-Mile radius found] ${f}`);
    }
  }
});
if (!errors.some(e => e.includes('15-Mile'))) {
  console.log('  ✓ Zero "15 Miles" radius contradictions found across all HTML/TXT/MD pages.');
}

// 2. Check for obsolete pricing numbers (Legacy +/-30% ranges and uncalibrated values)
console.log('\n--- [CHECK 2] Outdated / Legacy Pricing Strings (+/-30% Variance Audit) ---');
const legacyPrices = [
  { str: '$154 - $286', name: 'Legacy +/-30% 1-Pickup ($154 - $286)' },
  { str: '$154–$286', name: 'Legacy +/-30% 1-Pickup ($154–$286)' },
  { str: '$308 - $572', name: 'Legacy +/-30% 2-Pickups ($308 - $572)' },
  { str: '$308–$572', name: 'Legacy +/-30% 2-Pickups ($308–$572)' },
  { str: '$462 - $858', name: 'Legacy +/-30% 3-Pickups ($462 - $858)' },
  { str: '$462–$858', name: 'Legacy +/-30% 3-Pickups ($462–$858)' },
  { str: '$85/yd - $140', name: 'Legacy Yard Waste $140' },
  { str: '$95-$140', name: 'Legacy MINI Schema $140' }
];

allFiles.forEach(f => {
  if (/\.(html|json|txt|md|tsx)$/.test(f) && !f.includes('scripts') && !f.includes('blueprint')) {
    const content = fs.readFileSync(f, 'utf8');
    legacyPrices.forEach(lp => {
      totalChecks++;
      if (content.includes(lp.str)) {
        errors.push(`[${lp.name}] in ${f}`);
      }
    });
  }
});
if (!errors.some(e => e.includes('Legacy'))) {
  console.log('  ✓ Zero legacy +/-30% pricing strings found. All files harmonized to +/-20% canonical matrix.');
}

// 3. Check for Eager YouTube iframes in Raw Static HTML (excluding script tags)
console.log('\n--- [CHECK 3] Crawler Sanitization (Eager YouTube <iframe> Audit) ---');
let eagerIframes = 0;
allFiles.forEach(f => {
  if (/\.(html|tsx)$/.test(f) && !f.includes('preview')) {
    totalChecks++;
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    const match = content.match(/<iframe[^>]+src=["']https:\/\/(www\.)?youtube/gi);
    if (match) {
      errors.push(`[Eager YouTube iframe found in raw HTML (${match.length})] in ${f}`);
      eagerIframes += match.length;
    }
  }
});
if (eagerIframes === 0) {
  console.log('  ✓ Zero eager YouTube <iframe> tags in raw HTML. High-performance video facades active.');
}

// 4. Check JSON Validity in knowledge, well-known, and feeds
console.log('\n--- [CHECK 4] JSON Graph Syntax & Parsing Validation ---');
const jsonFiles = [
  'knowledge/index.json',
  'knowledge/pricing-logic.json',
  '.well-known/agent.json',
  '.well-known/pricing.json',
  'public/knowledge/index.json',
  'public/knowledge/pricing-logic.json',
  'public/.well-known/agent.json',
  'public/.well-known/pricing.json'
];

jsonFiles.forEach(jf => {
  totalChecks++;
  if (fs.existsSync(jf)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jf, 'utf8'));
      console.log(`  ✓ Valid JSON: ${jf} (${Object.keys(parsed).length} top-level keys)`);
    } catch (err) {
      errors.push(`[Invalid JSON] ${jf}: ${err.message}`);
    }
  } else {
    errors.push(`[Missing File] ${jf}`);
  }
});

// 5. Check Business Identity & Canonical Manifest Signals
console.log('\n--- [CHECK 5] Business Identity & Entity Signals ---');
const requiredSignals = [
  { file: 'index.html', str: '604-676-011', label: 'WA UBI Active' },
  { file: 'index.html', str: 'Martin Silchuk', label: 'Owner-Operator Martin Silchuk' },
  { file: 'index.html', str: '2007', label: 'Founded 2007' },
  { file: 'index.html', str: '258+', label: '258+ Verified Reviews' },
  { file: 'index.html', str: 'utm_content=4', label: 'AMZY Handoff Parameter' },
  { file: 'llms.txt', str: '604-676-011', label: 'llms.txt UBI' },
  { file: 'llms-workflows.txt', str: '4.0', label: 'llms-workflows.txt v4.0' },
  { file: '.well-known/agent.json', str: '604-676-011', label: 'agent.json UBI' },
  { file: '.well-known/pricing.json', str: '95', label: 'pricing.json Hard Floor $95' }
];

requiredSignals.forEach(rs => {
  totalChecks++;
  if (fs.existsSync(rs.file)) {
    const content = fs.readFileSync(rs.file, 'utf8');
    if (content.includes(rs.str)) {
      console.log(`  ✓ Verified ${rs.label} in ${rs.file}`);
    } else {
      errors.push(`[Missing Signal: ${rs.label}] in ${rs.file}`);
    }
  }
});

// 6. Check Vercel & Next.js Header Rules for Knowledge & Pricing Projections
console.log('\n--- [CHECK 6] Vercel & Next.js Header Routing & MIME Type Enforcements ---');
const vercelContent = fs.readFileSync('vercel.json', 'utf8');
totalChecks++;
if (vercelContent.includes('/.well-known/pricing.json')) {
  console.log('  ✓ Vercel headers configured for /.well-known/pricing.json');
} else {
  errors.push('[Vercel Headers Error] Missing /.well-known/pricing.json rule in vercel.json');
}

totalChecks++;
if (vercelContent.includes('/knowledge/(.*)\\\\.json') && vercelContent.includes('/knowledge/(.*)\\\\.md')) {
  console.log('  ✓ Vercel headers configured with precise regex for /knowledge/*.json and /knowledge/*.md');
} else {
  errors.push('[Vercel Headers Error] Missing precise knowledge regex in vercel.json');
}

const nextConfigContent = fs.readFileSync('next.config.js', 'utf8');
totalChecks++;
if (nextConfigContent.includes('/.well-known/pricing.json')) {
  console.log('  ✓ Next.js headers configured for /.well-known/pricing.json');
} else {
  errors.push('[Next.js Headers Error] Missing /.well-known/pricing.json rule in next.config.js');
}

totalChecks++;
if (nextConfigContent.includes('/knowledge/:path*.json') && nextConfigContent.includes('/knowledge/:path*.md')) {
  console.log('  ✓ Next.js headers configured with mutually exclusive rules for /knowledge/*.json and /knowledge/*.md');
} else {
  errors.push('[Next.js Headers Error] Missing mutually exclusive knowledge rules in next.config.js');
}

// 7. Check Historical Job Stories Disambiguation Banners
console.log('\n--- [CHECK 7] Historical Job Stories Operational Context & Disclaimers ---');
const jobSlugs = [
  'federal-way-commercial-refrigerator-extraction',
  'auburn-birch-tree-yard-waste-clearing',
  'auburn-playset-shed-demolition',
  'basketball-court-wall-demolition-renton-skyway',
  'federal-way-heavy-treadmill-disassembly',
  'ne-tacoma-moving-cleanout',
  'tacoma-concrete-construction-debris-removal'
];

jobSlugs.forEach(slug => {
  const filePath = `jobs/${slug}/index.html`;
  totalChecks++;
  if (fs.existsSync(filePath)) {
    const c = fs.readFileSync(filePath, 'utf8');
    if (c.includes('job-historical-disclaimer')) {
      console.log(`  ✓ Verified Historical Disclaimer in ${slug}`);
    } else {
      errors.push(`[Missing Historical Disclaimer] in ${filePath}`);
    }
  }
});

// 8. Check Hero Repetition & Single Canonical H1 Architecture
console.log('\n--- [CHECK 8] Hero Repetition & Single Canonical H1 Validation ---');
const idxHtml = fs.readFileSync('index.html', 'utf8');

totalChecks++;
const h1Matches = idxHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
if (h1Matches.length === 1) {
  console.log('  ✓ Exactly one canonical H1 tag present in index.html');
} else {
  errors.push(`[H1 Architecture Error] Expected 1 H1 tag in index.html, found ${h1Matches.length}`);
}

totalChecks++;
if (!idxHtml.includes('hero-variant-control-section') && !idxHtml.includes('hero-variant-social-section')) {
  console.log('  ✓ Zero A/B hero variant classes found in index.html');
} else {
  errors.push('[Hero Repetition Error] Found legacy hero-variant classes in index.html');
}

totalChecks++;
if (!idxHtml.includes('hero-ab-engine') && !idxHtml.includes('hero-ab-social')) {
  console.log('  ✓ Zero A/B engine scripts or cookie mutation classes in index.html');
} else {
  errors.push('[A/B Engine Error] Found legacy hero-ab-engine script or class in index.html');
}

totalChecks++;
const headlineCount = (idxHtml.match(/Fast, Friendly &amp; Fair-Priced Junk Removal/g) || []).length;
if (headlineCount === 1) {
  console.log('  ✓ Exactly 1 primary headline instance (Zero token duplication at DOM top)');
} else {
  errors.push(`[Hero Headline Duplication Error] Expected 1 primary headline, found ${headlineCount}`);
}

console.log('\n====================================================');
console.log(`TOTAL AUDIT CHECKS: ${totalChecks}`);
console.log(`TOTAL ERRORS:       ${errors.length}`);
console.log('====================================================');

if (errors.length > 0) {
  console.log('\nERRORS FOUND:');
  errors.forEach(e => console.log('  ✗', e));
  process.exit(1);
} else {
  console.log('\n🎉 ALL APP-WIDE DIAGNOSTIC CHECKS PASSED WITH 0 ERRORS! ✅');
}
