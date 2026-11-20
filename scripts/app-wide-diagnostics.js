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
    if (file.name === 'node_modules' || file.name === '.git' || file.name === '.next' || file.name === 'archive') continue;
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
  if (/\.(html|txt|md)$/.test(f)) {
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

// 2. Check for obsolete pricing numbers ($140 for yard waste, legacy tiers)
console.log('\n--- [CHECK 2] Outdated / Unharmonized Pricing Strings ---');
const legacyPrices = [
  { str: '$85/yd - $140', name: 'Legacy Yard Waste $140' },
  { str: '$95-$140', name: 'Legacy MINI Schema $140' },
  { str: '230 - 415', name: 'Old 2-Pickup Tier $230-$415' },
  { str: '740 - 1,110', name: 'Old Dump Truck Tier $740-$1,110' },
  { str: '1,110 - 1,480', name: 'Old Dump Truck Plus $1,110-$1,480' }
];

allFiles.forEach(f => {
  if (/\.(html|json|txt|md|tsx)$/.test(f)) {
    const content = fs.readFileSync(f, 'utf8');
    legacyPrices.forEach(lp => {
      totalChecks++;
      if (content.includes(lp.str)) {
        errors.push(`[${lp.name}] in ${f}`);
      }
    });
  }
});
if (!errors.some(e => e.includes('Legacy') || e.includes('Old'))) {
  console.log('  ✓ Zero legacy pricing strings found. All files harmonized to canonical matrix.');
}

// 3. Check for Eager YouTube iframes in Raw Static HTML (excluding script tags)
console.log('\n--- [CHECK 3] Crawler Sanitization (Eager YouTube <iframe> Audit) ---');
let eagerIframes = 0;
allFiles.forEach(f => {
  if (/\.(html|tsx)$/.test(f) && !f.includes('preview')) {
    totalChecks++;
    let content = fs.readFileSync(f, 'utf8');
    // Strip <script> tags to only inspect raw static HTML sent to non-JS crawlers
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
  'public/knowledge/index.json',
  'public/knowledge/pricing-logic.json',
  'public/.well-known/agent.json'
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

// 5. Check Business Identity Integrity Across Core Root Files
console.log('\n--- [CHECK 5] Business Identity & Entity Signals ---');
const requiredSignals = [
  { file: 'index.html', str: '604-676-011', label: 'WA UBI Active' },
  { file: 'index.html', str: 'Martin Silchuk', label: 'Owner-Operator Martin Silchuk' },
  { file: 'index.html', str: '2007', label: 'Founded 2007' },
  { file: 'index.html', str: '258+', label: '258+ Verified Reviews' },
  { file: 'index.html', str: 'utm_content=4', label: 'AMZY Handoff Parameter' },
  { file: 'llms.txt', str: '604-676-011', label: 'llms.txt UBI' },
  { file: 'llms-workflows.txt', str: '3.0', label: 'llms-workflows.txt v3.0' },
  { file: '.well-known/agent.json', str: '604-676-011', label: 'agent.json UBI' }
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

// 6. Check Vercel Header Rules for Knowledge Graph Content-Types
console.log('\n--- [CHECK 6] Vercel Header Routing & Knowledge Content-Types ---');
const vercelContent = fs.readFileSync('vercel.json', 'utf8');
totalChecks++;
if (vercelContent.includes('/knowledge/(.*)\\\\.json') && vercelContent.includes('/knowledge/(.*)\\\\.md')) {
  console.log('  ✓ Vercel headers configured with precise regex for /knowledge/*.json and /knowledge/*.md');
} else {
  errors.push('[Vercel Headers Error] Missing precise knowledge regex in vercel.json');
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
