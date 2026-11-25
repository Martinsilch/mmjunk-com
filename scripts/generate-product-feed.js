/**
 * Generates spec-compliant product feeds for OpenAI ChatGPT Product Feed Ingestion:
 * - chatgpt-products.jsonl.gz (Required format for hosted JSONL URL feeds)
 * - chatgpt-products.csv      (Uncompressed CSV feed, accepted natively)
 * - chatgpt-products.tsv      (Uncompressed TSV feed, accepted natively)
 * - chatgpt-products.jsonl    (Raw uncompressed JSON Lines feed)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const { RAW_CATALOG_DATA, BRAND_NAME, SELLER_NAME, CANONICAL_SITE_URL } = require('./catalog-source.js');

function buildItems() {
  return RAW_CATALOG_DATA.map(item => {
    const priceFormatted = `${Number(item.priceAmount).toFixed(2)} USD`;
    const feedItem = {
      item_id: item.itemId,
      title: item.title,
      description: item.description,
      url: item.url,
      brand: BRAND_NAME,
      seller_name: SELLER_NAME,
      image_url: item.imageUrl,
      availability: 'in_stock',
      price: priceFormatted,
      target_countries: ['US'],
      store_country: 'US',
      is_eligible_search: true,
      product_category: item.productCategory,
      seller_url: CANONICAL_SITE_URL,
      shipping_price: '0.00 USD',
      accepts_returns: false
    };

    if (item.groupId) {
      feedItem.group_id = item.groupId;
      feedItem.listing_has_variations = true;
      feedItem.variant_dict = item.variantDict;
      feedItem.offer_id = item.offerId;
    } else if (item.offerId) {
      feedItem.offer_id = item.offerId;
    }

    if (item.additionalImageUrls && item.additionalImageUrls.length > 0) {
      feedItem.additional_image_urls = item.additionalImageUrls;
    }

    return feedItem;
  });
}

function generateJSONL(items) {
  return items.map(item => JSON.stringify(item)).join('\n') + '\n';
}

function escapeCsvCell(val) {
  if (val === undefined || val === null) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const OPENAI_FEED_COLUMNS = [
  'item_id',
  'title',
  'description',
  'url',
  'brand',
  'seller_name',
  'image_url',
  'availability',
  'price',
  'target_countries',
  'store_country',
  'group_id',
  'listing_has_variations',
  'variant_dict',
  'offer_id',
  'is_eligible_search',
  'product_category',
  'seller_url',
  'shipping_price',
  'accepts_returns',
  'additional_image_urls'
];

function generateCSV(items) {
  const rows = [OPENAI_FEED_COLUMNS.join(',')];

  items.forEach(item => {
    const row = [
      escapeCsvCell(item.item_id),
      escapeCsvCell(item.title),
      escapeCsvCell(item.description),
      escapeCsvCell(item.url),
      escapeCsvCell(item.brand),
      escapeCsvCell(item.seller_name),
      escapeCsvCell(item.image_url),
      escapeCsvCell(item.availability),
      escapeCsvCell(item.price),
      escapeCsvCell(JSON.stringify(item.target_countries)),
      escapeCsvCell(item.store_country),
      escapeCsvCell(item.group_id || ''),
      escapeCsvCell(item.listing_has_variations ? 'true' : ''),
      escapeCsvCell(item.variant_dict ? item.variant_dict : ''),
      escapeCsvCell(item.offer_id || ''),
      escapeCsvCell(item.is_eligible_search ? 'true' : 'false'),
      escapeCsvCell(item.product_category || ''),
      escapeCsvCell(item.seller_url || ''),
      escapeCsvCell(item.shipping_price || '0.00 USD'),
      escapeCsvCell(item.accepts_returns ? 'true' : 'false'),
      escapeCsvCell(item.additional_image_urls ? item.additional_image_urls.join(',') : '')
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n') + '\n';
}

function escapeTsvCell(val) {
  if (val === undefined || val === null) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return str.replace(/[\t\n\r]/g, ' ');
}

function generateTSV(items) {
  const rows = [OPENAI_FEED_COLUMNS.join('\t')];

  items.forEach(item => {
    const row = [
      escapeTsvCell(item.item_id),
      escapeTsvCell(item.title),
      escapeTsvCell(item.description),
      escapeTsvCell(item.url),
      escapeTsvCell(item.brand),
      escapeTsvCell(item.seller_name),
      escapeTsvCell(item.image_url),
      escapeTsvCell(item.availability),
      escapeTsvCell(item.price),
      escapeTsvCell(JSON.stringify(item.target_countries)),
      escapeTsvCell(item.store_country),
      escapeTsvCell(item.group_id || ''),
      escapeTsvCell(item.listing_has_variations ? 'true' : ''),
      escapeTsvCell(item.variant_dict ? item.variant_dict : ''),
      escapeTsvCell(item.offer_id || ''),
      escapeTsvCell(item.is_eligible_search ? 'true' : 'false'),
      escapeTsvCell(item.product_category || ''),
      escapeTsvCell(item.seller_url || ''),
      escapeTsvCell(item.shipping_price || '0.00 USD'),
      escapeTsvCell(item.accepts_returns ? 'true' : 'false'),
      escapeTsvCell(item.additional_image_urls ? item.additional_image_urls.join(',') : '')
    ];
    rows.push(row.join('\t'));
  });

  return rows.join('\n') + '\n';
}

function run() {
  const items = buildItems();
  const jsonl = generateJSONL(items);
  const jsonlGz = zlib.gzipSync(Buffer.from(jsonl, 'utf8'), { level: 9 });
  const csv = generateCSV(items);
  const tsv = generateTSV(items);

  const baseDirs = [
    path.join(__dirname, '..', 'feeds')
  ];

  baseDirs.forEach(baseDir => {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    // Write .jsonl
    fs.writeFileSync(path.join(baseDir, 'chatgpt-products.jsonl'), jsonl, 'utf8');

    // Write .jsonl.gz (binary)
    fs.writeFileSync(path.join(baseDir, 'chatgpt-products.jsonl.gz'), jsonlGz);

    // Write .csv
    fs.writeFileSync(path.join(baseDir, 'chatgpt-products.csv'), csv, 'utf8');

    // Write .tsv
    fs.writeFileSync(path.join(baseDir, 'chatgpt-products.tsv'), tsv, 'utf8');
  });

  console.log(`Generated offline verification feeds in feeds/ for ${items.length} catalog items:`);
  console.log(`  - chatgpt-products.jsonl.gz (${jsonlGz.length} bytes) [Gzip-compressed JSONL - REQUIRED by OpenAI for .jsonl feeds]`);
  console.log(`  - chatgpt-products.csv      (${csv.length} bytes)     [Uncompressed CSV - Accepted natively]`);
  console.log(`  - chatgpt-products.tsv      (${tsv.length} bytes)     [Uncompressed TSV - Accepted natively]`);
  console.log(`  - chatgpt-products.jsonl    (${jsonl.length} bytes)    [Uncompressed JSONL]`);
}

run();
