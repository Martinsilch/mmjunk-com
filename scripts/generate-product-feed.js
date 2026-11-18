/**
 * Generates the static chatgpt-products.jsonl file into public/ and feeds/
 */
const fs = require('fs');
const path = require('path');

// Compile or require the feed generator
// Since lib is TS, we can write a self-contained generator or use ts-node / import compiled
// But having a pure JS mirror or executing via ts-node ensures seamless static file writing.

const { RAW_CATALOG_DATA, BRAND_NAME, SELLER_NAME, CANONICAL_SITE_URL } = require('./catalog-source.js');

function generateJSONL() {
  const items = RAW_CATALOG_DATA.map(item => {
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

  return items.map(item => JSON.stringify(item)).join('\n') + '\n';
}

function run() {
  const jsonl = generateJSONL();

  // Targets
  const targets = [
    path.join(__dirname, '..', 'public', 'feeds', 'chatgpt-products.jsonl'),
    path.join(__dirname, '..', 'public', 'api', 'feeds', 'chatgpt-products.jsonl'),
    path.join(__dirname, '..', 'feeds', 'chatgpt-products.jsonl')
  ];

  targets.forEach(tgt => {
    const dir = path.dirname(tgt);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(tgt, jsonl, 'utf8');
    console.log(`Generated: ${tgt} (${jsonl.length} bytes, ${jsonl.trim().split('\n').length} items)`);
  });
}

run();
