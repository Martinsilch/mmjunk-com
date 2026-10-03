/**
 * Canonical Reputation & Review Metrics Synchronization Script
 * 
 * Synchronizes authoritative review counts, star ratings, and aggregate metrics
 * from `knowledge/reputation.json` across:
 * 1. AI & LLM manifests (llms.txt, llms-full.txt, public/llms.txt, public/llms-full.txt)
 * 2. Documentation & Authority Markdown (reviews.md, about-us.md, history.md, README.md, knowledge/*.md)
 * 3. Root & Regional Landing Pages (index.html, tacoma/index.html, junk-removal-*-wa/index.html)
 * 4. Semantic Service & Job Story Pages (services, jobs, and public/ counterparts)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPUTATION_JSON_PATH = path.join(ROOT_DIR, 'knowledge', 'reputation.json');

if (!fs.existsSync(REPUTATION_JSON_PATH)) {
  console.error(`❌ Missing authoritative reputation metrics store at ${REPUTATION_JSON_PATH}`);
  process.exit(1);
}

const repData = JSON.parse(fs.readFileSync(REPUTATION_JSON_PATH, 'utf8').replace(/^\uFEFF/, ''));
const count = repData.reviewCount;
const rating = repData.aggregateRating; // e.g. "5.0"
const bbb = repData.bbbRating || 'AAA+';

console.log('================================================================');
console.log(`🔄 REPUTATION SYNCHRONIZATION ENGINE`);
console.log(`Authoritative Metrics: ${count} verified reviews | ${rating}★ aggregate rating | ${bbb} BBB`);
console.log('================================================================\n');

// Mirror knowledge/reputation.json to public/knowledge/reputation.json
const publicRepPath = path.join(ROOT_DIR, 'public', 'knowledge', 'reputation.json');
fs.mkdirSync(path.dirname(publicRepPath), { recursive: true });
fs.writeFileSync(publicRepPath, JSON.stringify(repData, null, 2), 'utf8');
console.log(`✓ Mirrored to public/knowledge/reputation.json`);

let totalFilesProcessed = 0;
let totalFilesModified = 0;

function syncFile(relPath, transformFn) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return;

  totalFilesProcessed++;
  const original = fs.readFileSync(fullPath, 'utf8');
  const modified = transformFn(original);

  if (original !== modified) {
    fs.writeFileSync(fullPath, modified, 'utf8');
    totalFilesModified++;
    console.log(`  ✓ Updated: ${relPath}`);
  }
}

// ----------------------------------------------------
// 1. LLM & Machine-Readable Manifests
// ----------------------------------------------------
console.log('\n--- Syncing LLM & Agent Manifests ---');

function syncLlmsTxt(content) {
  // * **Rating:** 5/5 Stars (234 verified 5-star Google reviews; CID: ...
  return content.replace(
    /(\* \*\*Rating:\*\*\s*)\d+(?:\.\d+)?\/5 Stars \(\d+ verified 5-star Google reviews;/g,
    `$1${rating === '5.0' ? '5/5' : rating + '/5'} Stars (${count} verified 5-star Google reviews;`
  );
}

syncFile('llms.txt', syncLlmsTxt);
syncFile('public/llms.txt', syncLlmsTxt);

function syncLlmsFullTxt(content) {
  let c = content;
  // - **Customer Sentiment Index**: 5/5 Stars (234 verified 5-star Google Business reviews)
  c = c.replace(
    /(- \*\*Customer Sentiment Index\*\*:\s*)\d+(?:\.\d+)?\/5 Stars \(\d+ verified 5-star Google Business reviews\)/g,
    `$1${rating === '5.0' ? '5/5' : rating + '/5'} Stars (${count} verified 5-star Google Business reviews)`
  );
  // - **Aggregate Rating**: 5.0 / 5.0 Stars (234 verified reviews)
  c = c.replace(
    /(- \*\*Aggregate Rating\*\*:\s*)\d+(?:\.\d+)? \/ 5\.0 Stars \(\d+ verified reviews\)/g,
    `$1${rating} / 5.0 Stars (${count} verified reviews)`
  );
  return c;
}

syncFile('llms-full.txt', syncLlmsFullTxt);
syncFile('public/llms-full.txt', syncLlmsFullTxt);

// ----------------------------------------------------
// 2. Documentation & Authority Markdown
// ----------------------------------------------------
console.log('\n--- Syncing Documentation & Markdown Files ---');

function syncReviewsMd(content) {
  let c = content;
  // Frontmatter rating: 5.0, reviewCount: 234
  c = c.replace(/^(rating:\s*)[^\r\n]+/m, `$1${rating}`);
  c = c.replace(/^(reviewCount:\s*)[^\r\n]+/m, `$1${count}`);
  c = c.replace(/description:\s*\d+\+\s*verified\s*\d+(?:\.\d+)?-star/g, `description: ${count}+ verified ${rating}-star`);
  c = c.replace(/\b\d+(?:\.\d+)?-Star Google Rating across \d+\+ verified/g, `${rating}-Star Google Rating across ${count}+ verified`);
  return c;
}

syncFile('reviews.md', syncReviewsMd);
syncFile('public/reviews.md', syncReviewsMd);

function syncAboutUs(content) {
  return content.replace(
    /earning over \*\*\d+ verified \d+(?:\.\d+)?-star Google reviews\*\*/g,
    `earning over **${count} verified ${rating}-star Google reviews**`
  );
}
syncFile('public/about-us.md', syncAboutUs);
syncFile('about-us.md', syncAboutUs);

function syncHistory(content) {
  return content.replace(
    /with over \*\*\d+ verified \d+(?:\.\d+)?-star reviews\*\*/g,
    `with over **${count} verified ${rating}-star reviews**`
  );
}
syncFile('public/history.md', syncHistory);
syncFile('history.md', syncHistory);

function syncEstateCleanout(content) {
  return content.replace(
    /\d+(?:\.\d+)?-Star Google Review reputation \(\d+\+ verified reviews\)/g,
    `${rating}-Star Google Review reputation (${count}+ verified reviews)`
  );
}
syncFile('knowledge/estate-cleanout.md', syncEstateCleanout);
syncFile('public/knowledge/estate-cleanout.md', syncEstateCleanout);

function syncReadme(content) {
  return content.replace(
    /(- \*\*Rating:\*\*\s*)\d+(?:\.\d+)? Stars \(\d+ Verified Google Reviews\)/g,
    `$1${rating} Stars (${count} Verified Google Reviews)`
  );
}
syncFile('README.md', syncReadme);

// ----------------------------------------------------
// 3. Static HTML Pages & Schema.org AggregateRating
// ----------------------------------------------------
console.log('\n--- Syncing Static HTML Pages & JSON-LD Schemas ---');

function syncHtmlSchema(content) {
  // Regex matches AggregateRating blocks and safely updates ratingValue and reviewCount
  return content.replace(
    /("aggregateRating":\s*\{[\s\S]*?"@type":\s*"AggregateRating",[\s\S]*?"ratingValue":\s*")[^"]+("[\s\S]*?"reviewCount":\s*")[^"]+(")/g,
    `$1${rating}$2${count}$3`
  );
}

function syncIndexHtml(content) {
  let c = syncHtmlSchema(content);
  // Meta description
  c = c.replace(/\d+\+ 5-star Google reviews/g, `${count}+ 5-star Google reviews`);
  c = c.replace(/with \d+ 5-star Google reviews/g, `with ${count} 5-star Google reviews`);
  // UI metrics and trust headers
  c = c.replace(/\b\d+ Verified 5-Star Reviews\b/g, `${count} Verified 5-Star Reviews`);
  c = c.replace(/(<div class="trust-metric__number">)\d+\+(<\/div>)/g, `$1${count}+$2`);
  c = c.replace(/title="\d+ Verified Google Reviews"/g, `title="${count} Verified Google Reviews"`);
  c = c.replace(
    /(<h3 class="social-authority-card__title">Google: <strong>)\d+(?:\.\d+)? ★(<\/strong> <span class="social-authority-card__sub">\()\d+ Reviews(\)<\/span><\/h3>)/g,
    `$1${rating} ★$2${count} Reviews$3`
  );
  c = c.replace(/See All \d+ Reviews on Google Maps/g, `See All ${count} Reviews on Google Maps`);
  return c;
}

syncFile('index.html', syncIndexHtml);

function syncTacomaIndex(content) {
  let c = syncHtmlSchema(content);
  c = c.replace(/\d+\+ 5-star Google reviews/g, `${count}+ 5-star Google reviews`);
  c = c.replace(/\b\d+ Consecutive 5-Star Reviews\b/g, `${count} Consecutive 5-Star Reviews`);
  c = c.replace(/(<div class="trust-metric__number">)\d+\+(<\/div>)/g, `$1${count}+$2`);
  c = c.replace(/Based on \d+ Verified Google Reviews/g, `Based on ${count} Verified Google Reviews`);
  c = c.replace(/See All \d+ Reviews on Google Maps/g, `See All ${count} Reviews on Google Maps`);
  c = c.replace(/Google Reviews \(\d+\+\)/g, `Google Reviews (${count}+)`);
  return c;
}

syncFile('tacoma/index.html', syncTacomaIndex);

// Spoke pages (junk-removal-*-wa/index.html)
const spokeDirs = fs.readdirSync(ROOT_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.startsWith('junk-removal-') && d.name.endsWith('-wa'));

for (const dir of spokeDirs) {
  const fileRel = path.join(dir.name, 'index.html');
  syncFile(fileRel, (content) => {
    let c = syncHtmlSchema(content);
    c = c.replace(/(<div class="local-stat-card__val">)\d+\+(<\/div>)/g, `$1${count}+$2`);
    c = c.replace(/and \d+\+ 5-star Google reviews/g, `and ${count}+ 5-star Google reviews`);
    return c;
  });
}

// Services and Jobs pages (both root and public/)
function syncHtmlDirectory(dirRel) {
  const base = path.join(ROOT_DIR, dirRel);
  if (!fs.existsSync(base)) return;

  function traverse(cur) {
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        traverse(full);
      } else if (ent.isFile() && ent.name.endsWith('.html')) {
        const rel = path.relative(ROOT_DIR, full);
        syncFile(rel, syncHtmlSchema);
      }
    }
  }
  traverse(base);
}

syncHtmlDirectory('services');
syncHtmlDirectory('public/services');
syncHtmlDirectory('jobs');
syncHtmlDirectory('public/jobs');

console.log('\n================================================================');
console.log(`✅ SYNCHRONIZATION COMPLETE`);
console.log(`Files Processed: ${totalFilesProcessed} | Files Updated: ${totalFilesModified}`);
console.log('================================================================');
