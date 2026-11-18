/**
 * M&M Junk Removal — OpenAI ChatGPT Product Feed Spec Compliance Validator
 *
 * Verifies 100% adherence to OpenAI Product Feed Schema:
 * 1. JSONL Formatting (single line per record, UTF-8 clean, valid JSON.parse)
 * 2. 11 Required Fields with exact types and regex constraints
 * 3. Variant Grouping rules (group_id != item_id, listing_has_variations === true, variant_dict)
 * 4. 100% Uniqueness of item_id and offer_id
 * 5. Zero Prohibited Placeholders ("null", "n/a", empty strings, etc.)
 * 6. Local Asset & Route Resolution (All URLs & images map to existing assets)
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('  OPENAI CHATGPT PRODUCT FEED SPEC COMPLIANCE AUDIT  ');
console.log('====================================================\n');

let totalErrors = 0;
let totalChecks = 0;
const errors = [];

function recordPass(msg) {
  totalChecks++;
  console.log(`  ✓ ${msg}`);
}

function recordFail(msg) {
  totalChecks++;
  totalErrors++;
  errors.push(msg);
  console.error(`  ❌ ${msg}`);
}

const FEED_PATH = path.join(__dirname, '..', 'public', 'feeds', 'chatgpt-products.jsonl');

if (!fs.existsSync(FEED_PATH)) {
  recordFail(`Feed file not found at ${FEED_PATH}`);
  process.exit(1);
}

const rawContent = fs.readFileSync(FEED_PATH, 'utf8');
const lines = rawContent.split('\n').filter(line => line.trim().length > 0);

console.log(`Auditing Feed File: ${FEED_PATH}`);
console.log(`Total Records: ${lines.length}\n`);

// Data structures for tracking uniqueness and variant groupings
const seenItemIds = new Map();
const seenOfferIds = new Map();
const variantGroups = new Map();

// Helper for deep inspection of forbidden placeholders
function checkForForbiddenPlaceholders(obj, pathPrefix, recordIndex) {
  const forbidden = ['null', 'n/a', 'na', 'unknown', 'undefined', 'none', ''];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = `${pathPrefix}.${key}`;

    if (value === null || value === undefined) {
      recordFail(`Record [${recordIndex}] ${currentPath}: Explicit null or undefined found! Key must be omitted.`);
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        recordFail(`Record [${recordIndex}] ${currentPath}: Empty string found!`);
      }
      if (forbidden.includes(trimmed.toLowerCase())) {
        recordFail(`Record [${recordIndex}] ${currentPath}: Forbidden placeholder "${trimmed}" found!`);
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        recordFail(`Record [${recordIndex}] ${currentPath}: Empty array found! Field should be omitted if empty.`);
      }
      value.forEach((elem, idx) => {
        if (typeof elem === 'string') {
          if (elem.trim() === '' || forbidden.includes(elem.trim().toLowerCase())) {
            recordFail(`Record [${recordIndex}] ${currentPath}[${idx}]: Forbidden placeholder "${elem}" in array!`);
          }
        }
      });
    } else if (typeof value === 'object') {
      checkForForbiddenPlaceholders(value, currentPath, recordIndex);
    }
  }
}

// -----------------------------------------------------------------------------
// AUDIT EACH RECORD
// -----------------------------------------------------------------------------
lines.forEach((line, index) => {
  const recordNum = index + 1;
  let record;

  // Check 1: Valid single-line JSON
  try {
    record = JSON.parse(line);
  } catch (err) {
    recordFail(`Record [${recordNum}]: Malformed JSON on line: ${err.message}`);
    return;
  }

  const itemId = record.item_id;

  // Check 2: item_id required, format, and uniqueness
  if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
    recordFail(`Record [${recordNum}]: Missing or invalid item_id`);
  } else {
    if (seenItemIds.has(itemId)) {
      recordFail(`Record [${recordNum}]: Duplicate item_id "${itemId}" (first seen at record ${seenItemIds.get(itemId)})`);
    } else {
      seenItemIds.set(itemId, recordNum);
    }
    // Check no price in item_id
    if (/\$|\d+\.\d{2}|usd/i.test(itemId)) {
      recordFail(`Record [${recordNum}] (${itemId}): item_id must NOT contain price patterns`);
    }
  }

  // Check 3: offer_id uniqueness if present
  if (record.offer_id) {
    if (typeof record.offer_id !== 'string' || record.offer_id.trim() === '') {
      recordFail(`Record [${recordNum}] (${itemId}): Invalid offer_id format`);
    } else {
      if (seenOfferIds.has(record.offer_id)) {
        recordFail(`Record [${recordNum}] (${itemId}): Duplicate offer_id "${record.offer_id}"`);
      } else {
        seenOfferIds.set(record.offer_id, recordNum);
      }
    }
  }

  // Check 4: title constraints (max 150 chars, non-empty)
  if (!record.title || typeof record.title !== 'string') {
    recordFail(`Record [${recordNum}] (${itemId}): Missing required title`);
  } else {
    if (record.title.length > 150) {
      recordFail(`Record [${recordNum}] (${itemId}): Title exceeds 150 chars (${record.title.length} chars)`);
    }
  }

  // Check 5: description constraints (max 5000 chars, no HTML, no markdown)
  if (!record.description || typeof record.description !== 'string') {
    recordFail(`Record [${recordNum}] (${itemId}): Missing required description`);
  } else {
    if (record.description.length > 5000) {
      recordFail(`Record [${recordNum}] (${itemId}): Description exceeds 5000 chars (${record.description.length} chars)`);
    }
    // HTML tags check
    if (/<[^>]+>/.test(record.description)) {
      recordFail(`Record [${recordNum}] (${itemId}): Description contains HTML tags`);
    }
    // Markdown check
    if (/\[.*?\]\(.*?\)|[*_`#]/.test(record.description)) {
      recordFail(`Record [${recordNum}] (${itemId}): Description contains markdown formatting`);
    }
    // Geographic and service scope check
    const descLower = record.description.toLowerCase();
    if (!descLower.includes('king') && !descLower.includes('pierce')) {
      recordFail(`Record [${recordNum}] (${itemId}): Description missing authorized service area context`);
    }
  }

  // Check 6: url constraints (HTTPS, mmjunk.com)
  if (!record.url || typeof record.url !== 'string') {
    recordFail(`Record [${recordNum}] (${itemId}): Missing required url`);
  } else {
    if (!record.url.startsWith('https://')) {
      recordFail(`Record [${recordNum}] (${itemId}): url must use HTTPS protocol (${record.url})`);
    }
    try {
      const parsedUrl = new URL(record.url);
      const host = parsedUrl.hostname;
      if (host !== 'mmjunk.com' && host !== 'www.mmjunk.com') {
        recordFail(`Record [${recordNum}] (${itemId}): url must point to mmjunk.com domain (${host})`);
      }
    } catch {
      recordFail(`Record [${recordNum}] (${itemId}): Invalid url format: ${record.url}`);
    }
  }

  // Check 7: brand & seller_name exact strings
  if (record.brand !== 'M&M Junk Removal') {
    recordFail(`Record [${recordNum}] (${itemId}): brand must be "M&M Junk Removal", got "${record.brand}"`);
  }
  if (record.seller_name !== 'M&M Junk Removal Service') {
    recordFail(`Record [${recordNum}] (${itemId}): seller_name must be "M&M Junk Removal Service", got "${record.seller_name}"`);
  }

  // Check 8: image_url constraints (HTTPS, JPEG/PNG format, resolution)
  if (!record.image_url || typeof record.image_url !== 'string') {
    recordFail(`Record [${recordNum}] (${itemId}): Missing required image_url`);
  } else {
    if (!record.image_url.startsWith('https://')) {
      recordFail(`Record [${recordNum}] (${itemId}): image_url must use HTTPS protocol`);
    }
    if (!/\.(png|jpe?g)$/i.test(record.image_url)) {
      recordFail(`Record [${recordNum}] (${itemId}): image_url must end with .png or .jpg/.jpeg (${record.image_url})`);
    }
  }

  // Check 9: availability exact string "in_stock"
  if (record.availability !== 'in_stock') {
    recordFail(`Record [${recordNum}] (${itemId}): availability must be lowercase "in_stock", got "${record.availability}"`);
  }

  // Check 10: price regex format and strictly > 0.00
  const priceRegex = /^\d+\.\d{2} [A-Z]{3}$/;
  if (!record.price || !priceRegex.test(record.price)) {
    recordFail(`Record [${recordNum}] (${itemId}): price "${record.price}" must match strictly "AMOUNT CURRENCY" format`);
  } else {
    const [amtStr, currency] = record.price.split(' ');
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) {
      recordFail(`Record [${recordNum}] (${itemId}): price must be strictly > 0.00 USD`);
    }
    if (currency !== 'USD') {
      recordFail(`Record [${recordNum}] (${itemId}): price currency must be USD`);
    }
  }

  // Check 11: target_countries & store_country
  if (!Array.isArray(record.target_countries) || record.target_countries.length !== 1 || record.target_countries[0] !== 'US') {
    recordFail(`Record [${recordNum}] (${itemId}): target_countries must be strictly ["US"]`);
  }
  if (record.store_country !== 'US') {
    recordFail(`Record [${recordNum}] (${itemId}): store_country must be strictly "US"`);
  }

  // Check 12: Variant Grouping Logic
  if (record.group_id) {
    if (record.group_id === record.item_id) {
      recordFail(`Record [${recordNum}] (${itemId}): group_id must NOT equal item_id!`);
    }
    if (record.listing_has_variations !== true) {
      recordFail(`Record [${recordNum}] (${itemId}): listing_has_variations must be boolean true on variant items`);
    }
    if (!record.variant_dict || typeof record.variant_dict !== 'object' || Object.keys(record.variant_dict).length === 0) {
      recordFail(`Record [${recordNum}] (${itemId}): variant_dict must be a non-empty object on variant items`);
    } else {
      for (const [vKey, vVal] of Object.entries(record.variant_dict)) {
        if (!vVal || typeof vVal !== 'string' || vVal.trim() === '') {
          recordFail(`Record [${recordNum}] (${itemId}): variant_dict.${vKey} must be a non-empty string`);
        }
      }
    }
    if (!record.offer_id) {
      recordFail(`Record [${recordNum}] (${itemId}): offer_id is required on variant items`);
    }

    // Register in variant group for inter-item consistency check
    if (!variantGroups.has(record.group_id)) {
      variantGroups.set(record.group_id, []);
    }
    variantGroups.get(record.group_id).push(record);
  } else {
    // Standalone item: must NOT have listing_has_variations or variant_dict
    if (record.listing_has_variations !== undefined) {
      recordFail(`Record [${recordNum}] (${itemId}): Standalone item must omit listing_has_variations`);
    }
    if (record.variant_dict !== undefined) {
      recordFail(`Record [${recordNum}] (${itemId}): Standalone item must omit variant_dict`);
    }
  }

  // Check 13: Optional fields validity
  if (record.is_eligible_search !== undefined && typeof record.is_eligible_search !== 'boolean') {
    recordFail(`Record [${recordNum}] (${itemId}): is_eligible_search must be boolean`);
  }
  if (record.shipping_price !== undefined && !priceRegex.test(record.shipping_price)) {
    recordFail(`Record [${recordNum}] (${itemId}): shipping_price must match price format "0.00 USD"`);
  }
  if (record.accepts_returns !== undefined && typeof record.accepts_returns !== 'boolean') {
    recordFail(`Record [${recordNum}] (${itemId}): accepts_returns must be boolean`);
  }

  // Check 14: Disallowed review/checkout fields
  if (record.store_review_count !== undefined || record.store_star_rating !== undefined) {
    recordFail(`Record [${recordNum}] (${itemId}): store_review_count and store_star_rating must be omitted per spec`);
  }
  if (record.is_eligible_checkout !== undefined || record.is_ads_eligible !== undefined) {
    recordFail(`Record [${recordNum}] (${itemId}): is_eligible_checkout and is_ads_eligible must be omitted per spec`);
  }

  // Check 15: Zero prohibited placeholder values
  checkForForbiddenPlaceholders(record, `Record[${itemId}]`, recordNum);

  recordPass(`Record [${recordNum}] "${itemId}" (${record.price}) parsed and verified against all schema constraints.`);
});

// -----------------------------------------------------------------------------
// VARIANT GROUP CONSISTENCY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- Variant Group Consistency Checks ---');
for (const [groupId, items] of variantGroups.entries()) {
  if (items.length < 2) {
    recordFail(`Variant group "${groupId}" has fewer than 2 variants (${items.length} item). A group must contain at least 2 tiers.`);
  } else {
    recordPass(`Variant group "${groupId}" contains ${items.length} distinct tiers.`);
  }

  // Verify consistent variant_dict keys across all items in group
  const primaryKeys = Object.keys(items[0].variant_dict).sort().join(',');
  items.forEach(item => {
    const itemKeys = Object.keys(item.variant_dict).sort().join(',');
    if (itemKeys !== primaryKeys) {
      recordFail(`Variant group "${groupId}" key mismatch: ${item.item_id} has keys [${itemKeys}] vs group keys [${primaryKeys}]`);
    }
  });
}

// -----------------------------------------------------------------------------
// PHYSICAL ASSET & ROUTE RESOLUTION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- Live Route & Physical Asset Resolution Checks ---');

lines.forEach((line, index) => {
  const record = JSON.parse(line);
  const itemId = record.item_id;

  // 1. Verify URL corresponds to a real route / static file
  const parsedUrl = new URL(record.url);
  const urlPath = parsedUrl.pathname.replace(/\/$/, ''); // strip trailing slash

  let routeFound = false;
  if (urlPath === '' || urlPath === '/') {
    routeFound = fs.existsSync('index.html') || fs.existsSync('public/index.html');
  } else {
    const candidates = [
      path.join('.', urlPath, 'index.html'),
      path.join('public', urlPath, 'index.html'),
      path.join('app', urlPath, 'page.tsx'),
      path.join('app', urlPath, 'page.js')
    ];
    routeFound = candidates.some(c => fs.existsSync(c));
  }

  if (!routeFound) {
    recordFail(`Record (${itemId}): Route URL ${record.url} cannot be resolved to any HTML or Next.js page!`);
  }

  // 2. Verify primary image_url exists on disk
  const parsedImgUrl = new URL(record.image_url);
  const imgPath = decodeURIComponent(parsedImgUrl.pathname.replace(/^\//, ''));
  const imgCandidates = [
    path.join('.', imgPath),
    path.join('public', imgPath)
  ];
  const imgFound = imgCandidates.some(c => fs.existsSync(c));
  if (!imgFound) {
    recordFail(`Record (${itemId}): image_url "${record.image_url}" does NOT exist on disk!`);
  }

  // 3. Verify additional_image_urls exist on disk
  if (record.additional_image_urls) {
    record.additional_image_urls.forEach((extraUrl, extraIdx) => {
      const extraParsed = new URL(extraUrl);
      const extraImgPath = decodeURIComponent(extraParsed.pathname.replace(/^\//, ''));
      const extraCandidates = [
        path.join('.', extraImgPath),
        path.join('public', extraImgPath)
      ];
      if (!extraCandidates.some(c => fs.existsSync(c))) {
        recordFail(`Record (${itemId}): additional_image_urls[${extraIdx}] "${extraUrl}" does NOT exist on disk!`);
      }
    });
  }
});

// -----------------------------------------------------------------------------
// ROUTE HANDLER COMPLIANCE AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- Feed Route Handlers & Integration Checks ---');

const routeFeedsPath = path.join(__dirname, '..', 'app', 'feeds', 'chatgpt-products.jsonl', 'route.ts');
const routeApiFeedsPath = path.join(__dirname, '..', 'app', 'api', 'feeds', 'chatgpt-products.jsonl', 'route.ts');

if (fs.existsSync(routeFeedsPath)) {
  const content = fs.readFileSync(routeFeedsPath, 'utf8');
  if (content.includes('application/x-ndjson') && content.includes('GET') && content.includes('Cache-Control')) {
    recordPass(`Route handler at /feeds/chatgpt-products.jsonl is spec-compliant.`);
  } else {
    recordFail(`Route handler at ${routeFeedsPath} missing required headers or methods.`);
  }
} else {
  recordFail(`Route handler missing: ${routeFeedsPath}`);
}

if (fs.existsSync(routeApiFeedsPath)) {
  const content = fs.readFileSync(routeApiFeedsPath, 'utf8');
  if (content.includes('application/x-ndjson') && content.includes('GET') && content.includes('Cache-Control')) {
    recordPass(`Route handler at /api/feeds/chatgpt-products.jsonl is spec-compliant.`);
  } else {
    recordFail(`Route handler at ${routeApiFeedsPath} missing required headers or methods.`);
  }
} else {
  recordFail(`Route handler missing: ${routeApiFeedsPath}`);
}

// Check robots.txt allows feed
const robotsContent = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
if (robotsContent.includes('Allow: /feeds/')) {
  recordPass(`robots.txt explicitly allows /feeds/`);
} else {
  recordFail(`robots.txt missing Allow: /feeds/`);
}

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`TOTAL AUDIT CHECKS: ${totalChecks}`);
console.log(`TOTAL ERRORS:       ${totalErrors}`);
console.log('====================================================\n');

if (totalErrors === 0) {
  console.log('🎉 ZERO ERRORS FOUND! The ChatGPT Product Feed is 100% SPEC-COMPLIANT! ✅\n');
  process.exit(0);
} else {
  console.error(`❌ VALIDATION FAILED with ${totalErrors} errors.`);
  errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
  process.exit(1);
}
