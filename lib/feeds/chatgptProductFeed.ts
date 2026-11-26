import zlib from 'zlib';

/**
 * M&M Junk Removal — OpenAI ChatGPT Product Feed Generator
 *
 * Implements the OpenAI Product Feed Specification (JSON Lines format)
 * for ingestion via ChatGPT Business Hub ("Use a hosted URL").
 *
 * Base Pricing Model:
 * - MINI (Curbside Minimum): $95.00 USD
 * - 1 Pick Up Truck Load: $220.00 USD (Range +/- 20%: $176 - $264)
 * - 2 Pick Up Loads: $440.00 USD (Range +/- 20%: $352 - $528)
 * - 3 Pick Up Loads: $660.00 USD (Range +/- 20%: $528 - $792)
 * - Dump Truck Load (~5.5 pickup loads): $1,200.00 USD (Range +/- 20%: $960 - $1,440)
 * - Dump Truck Plus: $1,600.00 USD (Range: $1,560 - $2,400+)
 *
 * @see https://mmjunk.com/feeds/chatgpt-products.jsonl
 * @see https://mmjunk.com/api/feeds/chatgpt-products.jsonl
 */

export interface OpenAIFeedItem {
  // Required Fields
  item_id: string;
  title: string;
  description: string;
  url: string;
  brand: string;
  seller_name: string;
  image_url: string;
  availability: 'in_stock';
  price: string;
  target_countries: string[];
  store_country: string;

  // Variant Group Fields (present only on variant items)
  group_id?: string;
  listing_has_variations?: boolean;
  variant_dict?: Record<string, string>;
  offer_id?: string;

  // Recommended Optional Fields
  is_eligible_search?: boolean;
  product_category?: string;
  seller_url?: string;
  additional_image_urls?: string[];
  shipping_price?: string;
  accepts_returns?: boolean;
}

export const BRAND_NAME = 'M&M Junk Removal';
export const SELLER_NAME = 'M&M Junk Removal Service';
export const CANONICAL_SITE_URL = 'https://www.mmjunk.com';
export const PRIMARY_HERO_IMAGE = `${CANONICAL_SITE_URL}/assets/images/Federal%20Way%20WA%20Junk%20and%20Trash%20Removal.png`;

/**
 * Master catalog of active M&M Junk Removal services, volume load tiers,
 * item pickups, and demolition packages.
 */
export const RAW_CATALOG_DATA = [
  // =========================================================================
  // VARIANT GROUP: Truck Load Volume Tiers (group_id: MMJ-TRUCK-LOAD)
  // Base: $220 per pickup load (+/- 30%), Dump truck = $1,200 (~5.5 loads)
  // =========================================================================
  {
    itemId: 'MMJ-LOAD-MINI',
    offerId: 'mmjunk-MMJ-LOAD-MINI',
    groupId: 'MMJ-TRUCK-LOAD',
    variantDict: { load_size: 'MINI (Minimum Load)' },
    title: 'Full-Service Junk Removal — MINI (Minimum Load)',
    description: 'Curbside or single bulky item pickup (armchair, microwave, small mower, or up to 3 bags of household clutter). Baseline rate starts at $95. Includes labor, loading, hauling, and eco-friendly donation or certified recycling across South King and Pierce Counties, WA.',
    url: `${CANONICAL_SITE_URL}/services/residential?load=mini`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '95.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-LOAD-1-PICKUP',
    offerId: 'mmjunk-MMJ-LOAD-1-PICKUP',
    groupId: 'MMJ-TRUCK-LOAD',
    variantDict: { load_size: '1 Pick Up Truck Load' },
    title: 'Full-Service Junk Removal — 1 Pick Up Truck Load',
    description: 'Standard pickup truck bed volume capacity (approx. 4x8x2 ft bed). Base rate: $220 (ballpark range $176 - $264). Ideal for a 3-piece couch, mattress + box spring set, dining set, or 8-12 bagged household items. Includes two-person crew, loading, transport, and certified recycling across South King and Pierce Counties, WA.',
    url: `${CANONICAL_SITE_URL}/services/residential?load=1-pickup`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Mattress%20Removal.png`
    ],
    priceAmount: '220.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-LOAD-2-PICKUP',
    offerId: 'mmjunk-MMJ-LOAD-2-PICKUP',
    groupId: 'MMJ-TRUCK-LOAD',
    variantDict: { load_size: '2 Pick Up Loads' },
    title: 'Full-Service Junk Removal — 2 Pick Up Loads',
    description: 'Double pickup truck capacity. Base rate: $440 (ballpark range $352 - $528). Ideal for studio cleanouts, sectional sofas, garage clutter, yard debris piles, or light remodel scrap. Includes complete heavy lifting, sorting, sweep-up, hauling, and recycling across South King and Pierce Counties, WA.',
    url: `${CANONICAL_SITE_URL}/services/residential?load=2-pickup`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '440.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-LOAD-3-PICKUP',
    offerId: 'mmjunk-MMJ-LOAD-3-PICKUP',
    groupId: 'MMJ-TRUCK-LOAD',
    variantDict: { load_size: '3 Pick Up Loads' },
    title: 'Full-Service Junk Removal — 3 Pick Up Loads',
    description: 'Triple pickup truck capacity. Base rate: $660 (ballpark range $528 - $792). Perfect for multi-room home purges, basement or attic cleanouts, substantial yard clearing, or moderate contractor remodel debris. Includes full two-person loading, hauling, and eco-friendly diversion across South King and Pierce Counties, WA.',
    url: `${CANONICAL_SITE_URL}/services/residential?load=3-pickup`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '660.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-LOAD-DUMP-TRUCK',
    offerId: 'mmjunk-MMJ-LOAD-DUMP-TRUCK',
    groupId: 'MMJ-TRUCK-LOAD',
    variantDict: { load_size: 'Dump Truck Load' },
    title: 'Full-Service Junk Removal — Dump Truck Load',
    description: 'Full high-capacity hauling dump truck volume (approx. 5.5 pickup truck loads, rated up to 4.5 tons payload). Base rate: $1,200 (ballpark range $960 - $1,440). Ideal for garage overhauls, whole-home 2-3 bedroom cleanouts, roofing tear-off, or commercial office clearances across South King and Pierce Counties, WA.',
    url: `${CANONICAL_SITE_URL}/services/residential?load=dump-truck`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '1200.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-LOAD-DUMP-TRUCK-PLUS',
    offerId: 'mmjunk-MMJ-LOAD-DUMP-TRUCK-PLUS',
    groupId: 'MMJ-TRUCK-LOAD',
    variantDict: { load_size: 'Dump Truck Plus' },
    title: 'Full-Service Junk Removal — Dump Truck Plus',
    description: 'Multi-truck capacity cleanout exceeding one full dump truck (approx. 8-11 pickup loads). Starting base rate: $1,600 (ballpark range $1,560 - $2,400+). For whole-home estate liquidations (3,000+ sq ft), detached outbuildings, heavy contractor renovation debris, or estate hoarding remediation across South King and Pierce Counties, WA.',
    url: `${CANONICAL_SITE_URL}/services/residential?load=dump-truck-plus`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '1600.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },

  // =========================================================================
  // CORE DEDICATED SERVICE HUBS (Standalone Services)
  // =========================================================================
  {
    itemId: 'MMJ-SVC-RESIDENTIAL',
    offerId: 'mmjunk-MMJ-SVC-RESIDENTIAL',
    title: 'Residential Junk Removal and Home Cleanout Service',
    description: 'Full-service residential junk removal for homeowners, tenants, and families across South King and Pierce Counties, WA. Clear clutter from garages, attics, and basements with heavy lifting, loading, hauling, and eco-friendly charity donation or certified recycling included.',
    url: `${CANONICAL_SITE_URL}/services/residential`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '95.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-SVC-FURNITURE',
    offerId: 'mmjunk-MMJ-SVC-FURNITURE',
    title: 'Residential Furniture and Mattress Removal Service',
    description: 'Safe indoor carryout, disassembly, and hauling of heavy couches, sectionals, recliners, dressers, desks, and dining sets across South King and Pierce Counties, WA. Base pickup rate is $220. Clean, usable furniture is routed to local charity partners such as St. Vincent de Paul and Goodwill.',
    url: `${CANONICAL_SITE_URL}/services/residential-furniture-removal`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Mattress%20Removal.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '220.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Furniture Removal'
  },
  {
    itemId: 'MMJ-SVC-YARD-WASTE',
    offerId: 'mmjunk-MMJ-SVC-YARD-WASTE',
    title: 'Yard Waste Removal and Tree Branch Hauling Service',
    description: 'Pickup and hauling of fallen tree branches, timber logs, shrub clippings, brush piles, and organic storm debris across South King and Pierce Counties, WA. Starting rate from $95 per cubic yard (subject to $95 minimum service charge). 100% diverted from landfills to certified regional composting facilities for organic soil blending.',
    url: `${CANONICAL_SITE_URL}/services/yard-waste-removal`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Yard%20Trash%20Removal%20in%20Milton,%20WA.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '95.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-SVC-HOT-TUB',
    offerId: 'mmjunk-MMJ-SVC-HOT-TUB',
    title: 'Hot Tub Demolition and Spa Removal Service',
    description: 'Professional disassembly and extraction of backyard hot tubs, jacuzzis, and swim spas across South King and Pierce Counties, WA. Rates from $350 - $550. Includes electrical disconnect check, Sawzall shell sectioning, frame breakdown, deck/patio protection, broom sweep, and acrylic/motor recycling.',
    url: `${CANONICAL_SITE_URL}/services/hot-tub-demolition-removal`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Jacuzzi%20Hot%20Tub%20Removal.jpg`,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Jacuzzi%20Hot%20Tub%20Removal%20Before%20and%20After.jpg`
    ],
    priceAmount: '350.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-SVC-LIGHT-DEMO',
    offerId: 'mmjunk-MMJ-SVC-LIGHT-DEMO',
    title: 'Light Demolition Services for Sheds, Decks and Fences',
    description: 'Safe deconstruction and teardown of residential outbuildings, rotting cedar decks, chain-link fences, and playsets across South King and Pierce Counties, WA. Starting at $450. Complete crew teardown, nail sweep with magnetic rollers, lumber recycling, and grade-level broom clean.',
    url: `${CANONICAL_SITE_URL}/services/light-demolition-services`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Project.jpg`,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Process.jpg`
    ],
    priceAmount: '450.00',
    productCategory: 'Business & Industrial > Construction & Demolition > Debris Removal'
  },
  {
    itemId: 'MMJ-SVC-COMMERCIAL-APPLIANCE',
    offerId: 'mmjunk-MMJ-SVC-COMMERCIAL-APPLIANCE',
    title: 'Commercial Appliance Removal and EPA Freon Recovery',
    description: 'Certified extraction and recycling of commercial reach-in and walk-in coolers, restaurant freezers, ice makers, and industrial appliances across South King and Pierce Counties, WA. Base rate: $150. Includes certified EPA Section 608 Freon refrigerant evacuation, hydraulic liftgate loading, and scrap metal salvage.',
    url: `${CANONICAL_SITE_URL}/services/commercial-appliance-removal`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Enumclaw%20Trash%20and%20Refrigerator%20Removal.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '150.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Appliance Removal'
  },
  {
    itemId: 'MMJ-SVC-COMMERCIAL',
    offerId: 'mmjunk-MMJ-SVC-COMMERCIAL',
    title: 'Commercial Junk Removal and Office Decommissioning',
    description: 'Fast, insured debris clearance for retail storefronts, office suites, restaurants, and property managers across South King and Pierce Counties, WA. Base pickup load: $220. Cubicle decommissioning, conference furniture disposal, fixture removal, and e-waste diversion with itemized invoicing and COI.',
    url: `${CANONICAL_SITE_URL}/services/commercial`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '220.00',
    productCategory: 'Business & Industrial > Waste Management & Recycling > Commercial Waste Hauling'
  },
  {
    itemId: 'MMJ-SVC-CONSTRUCTION-DEBRIS',
    offerId: 'mmjunk-MMJ-SVC-CONSTRUCTION-DEBRIS',
    title: 'Construction Debris Removal and Jobsite Hauling',
    description: 'Heavy hauling of drywall, framing lumber, roofing shingles, ceramic tile, masonry rubble, and remodel scrap across South King and Pierce Counties, WA. Base pickup load: $220. Fleet rated up to 4.5 tons payload with certified transfer station weight receipts provided.',
    url: `${CANONICAL_SITE_URL}/services/construction-debris-removal`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '220.00',
    productCategory: 'Business & Industrial > Construction & Demolition > Debris Removal'
  },
  {
    itemId: 'MMJ-SVC-INDUSTRIAL',
    offerId: 'mmjunk-MMJ-SVC-INDUSTRIAL',
    title: 'Industrial Junk Removal and Heavy Debris Hauling',
    description: 'Heavy-duty hauling for distribution centers, manufacturing facilities, and industrial warehouses across South King and Pierce Counties, WA. Base pickup rate: $220. Broken concrete slabs, metal machinery, pallet cleanouts, and manufacturing scrap up to 4.5 tons per truckload.',
    url: `${CANONICAL_SITE_URL}/services/industrial`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '220.00',
    productCategory: 'Business & Industrial > Waste Management & Recycling > Industrial Waste Hauling'
  },
  {
    itemId: 'MMJ-SVC-ESTATE-CLEANOUT',
    offerId: 'mmjunk-MMJ-SVC-ESTATE-CLEANOUT',
    title: 'Estate Cleanout and Whole-Home Liquidation Service',
    description: 'Compassionate, methodical estate liquidation and probate property cleanouts across South King and Pierce Counties, WA. Multi-load cleanouts starting at 2 pickup loads ($440). Structured 4-way triage (valuables preservation, charity donation, scrap recycling, responsible disposal) with broom-clean finish.',
    url: `${CANONICAL_SITE_URL}/services/estate-cleanout`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '440.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-SVC-SORTING-DONATION',
    offerId: 'mmjunk-MMJ-SVC-SORTING-DONATION',
    title: 'Estate Sorting and Charity Donation Triage Service',
    description: 'On-site sorting, family heirloom staging, and charity donation coordination for downsizing seniors and estate executors across South King and Pierce Counties, WA. Express triage starts at $95. Includes donation delivery to local non-profit thrift partners with tax receipts retained.',
    url: `${CANONICAL_SITE_URL}/services/sorting-donation`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '95.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-SVC-RECURRING',
    offerId: 'mmjunk-MMJ-SVC-RECURRING',
    title: 'Scheduled Recurring Commercial Junk Removal Routes',
    description: 'Scheduled weekly, bi-weekly, or monthly dumpster enclosure sweeps, bulky item pickups, and tenant turnover trash-outs for apartment complexes, HOA communities, and commercial business parks across South King and Pierce Counties, WA. Route stops from $220.',
    url: `${CANONICAL_SITE_URL}/services/recurring`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '220.00',
    productCategory: 'Business & Industrial > Waste Management & Recycling > Commercial Waste Hauling'
  },
  {
    itemId: 'MMJ-SVC-CONTRACTUAL',
    offerId: 'mmjunk-MMJ-SVC-CONTRACTUAL',
    title: 'Commercial Hauling Retainer and Master Service Agreements',
    description: 'Commercial vendor contracts featuring priority 1-hour emergency dispatch, Net-30 invoicing, dedicated fleet scheduling, certificate of insurance (COI) issuance, and volume contract discounting across South King and Pierce Counties, WA. Rates from $220.',
    url: `${CANONICAL_SITE_URL}/services/contractual`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '220.00',
    productCategory: 'Business & Industrial > Waste Management & Recycling > Commercial Waste Hauling'
  },

  // =========================================================================
  // SPECIFIC ITEM PICKUPS & DEMOLITION PACKAGES
  // =========================================================================
  {
    itemId: 'MMJ-DEMO-SHED-10X12',
    offerId: 'mmjunk-MMJ-DEMO-SHED-10X12',
    title: 'Backyard Storage Shed Teardown and Removal (10x12)',
    description: 'Complete deconstruction of standard 8x10 to 12x16 wooden or metal backyard storage sheds across South King and Pierce Counties, WA. Base teardown: $650. Includes roof shingle removal, wall sectioning, flooring pry-up, lumber recycling, and full magnetic nail-sweep.',
    url: `${CANONICAL_SITE_URL}/services/light-demolition-services#shed`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Project.jpg`,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Process.jpg`
    ],
    priceAmount: '650.00',
    productCategory: 'Business & Industrial > Construction & Demolition > Debris Removal'
  },
  {
    itemId: 'MMJ-DEMO-SPORTS-COURT',
    offerId: 'mmjunk-MMJ-DEMO-SPORTS-COURT',
    title: 'Sports Court Half-Wall and Fence Demolition',
    description: 'Surgical dismantling and removal of basketball court wooden half-walls, chain-link sports fencing, and steel pipe posts across South King and Pierce Counties, WA. Base teardown: $850. Includes flush anchor cutoffs, 100% lumber recycling via DTG Recycle, and broom-clean court surface finish.',
    url: `${CANONICAL_SITE_URL}/services/light-demolition-services#court-wall`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Process.jpg`,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Project.jpg`
    ],
    priceAmount: '850.00',
    productCategory: 'Business & Industrial > Construction & Demolition > Debris Removal'
  },
  {
    itemId: 'MMJ-DEMO-PLAYSET',
    offerId: 'mmjunk-MMJ-DEMO-PLAYSET',
    title: 'Outdoor Playset and Wooden Swing Set Teardown',
    description: 'Teardown and haul-away of weathered outdoor wooden playsets, swing forts, gazebos, and pergolas across South King and Pierce Counties, WA. Base teardown: $450. Bolt unfastening, beam deconstruction, wood hauling, and yard raking included.',
    url: `${CANONICAL_SITE_URL}/services/light-demolition-services#playset`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Process.jpg`,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Shed%20Removal%20Project.jpg`
    ],
    priceAmount: '450.00',
    productCategory: 'Business & Industrial > Construction & Demolition > Debris Removal'
  },
  {
    itemId: 'MMJ-ITEM-REFRIGERATOR',
    offerId: 'mmjunk-MMJ-ITEM-REFRIGERATOR',
    title: 'Residential Refrigerator and Freezer Removal with Freon Recovery',
    description: 'Curbside or in-home extraction of residential refrigerators and deep freezers across South King and Pierce Counties, WA. Baseline single item: $95. Includes certified EPA Freon refrigerant recovery, heavy dolly carryout, and certified scrap metal recycling.',
    url: `${CANONICAL_SITE_URL}/services/commercial-appliance-removal#residential`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Enumclaw%20Trash%20and%20Refrigerator%20Removal.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '95.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Appliance Removal'
  },
  {
    itemId: 'MMJ-ITEM-MATTRESS',
    offerId: 'mmjunk-MMJ-ITEM-MATTRESS',
    title: 'Mattress and Box Spring Removal and Recycling Service',
    description: 'Hassle-free curbside or indoor pickup of any size mattress or box spring (Twin, Full, Queen, King, Cal King) across South King and Pierce Counties, WA. Baseline single item: $95. Items are delivered to certified mattress recycling facilities to reclaim steel coils, foam, and fabric.',
    url: `${CANONICAL_SITE_URL}/services/residential-furniture-removal#mattress`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Mattress%20Removal.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '95.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Furniture Removal'
  },
  {
    itemId: 'MMJ-ITEM-TREADMILL',
    offerId: 'mmjunk-MMJ-ITEM-TREADMILL',
    title: 'Heavy Treadmill and Exercise Equipment Disassembly and Hauling',
    description: 'Disassembly and extraction of heavy motorized treadmills, elliptical trainers, universal weight stations, and commercial fitness machinery across South King and Pierce Counties, WA. Base 1 pickup load rate: $220. Disassembly down tight staircases and doorways with 100% metal recycling.',
    url: `${CANONICAL_SITE_URL}/services/residential-furniture-removal#treadmill`,
    imageUrl: PRIMARY_HERO_IMAGE,
    additionalImageUrls: [
      `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`
    ],
    priceAmount: '220.00',
    productCategory: 'Home & Garden > Waste Management & Hauling > Junk Removal'
  },
  {
    itemId: 'MMJ-ITEM-CONCRETE-RUBBLE',
    offerId: 'mmjunk-MMJ-ITEM-CONCRETE-RUBBLE',
    title: 'Heavy Concrete Slabs and Masonry Rubble Hauling',
    description: 'Heavy debris extraction for broken concrete patio slabs, retaining wall blocks, brick pavers, and mortar rubble across South King and Pierce Counties, WA. Base pickup load: $220. Hauled directly to certified Puget Sound aggregate recovery facilities for rock crushing and road base reuse.',
    url: `${CANONICAL_SITE_URL}/services/construction-debris-removal#concrete`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Cleanup%20Before%20and%20after.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '220.00',
    productCategory: 'Business & Industrial > Construction & Demolition > Debris Removal'
  }
];

/**
 * Maps raw catalog records into spec-compliant OpenAI Product Feed objects.
 * Strictly enforces all required fields, formatting, and data hygiene rules.
 */
export function generateChatGPTProductFeed(): OpenAIFeedItem[] {
  return RAW_CATALOG_DATA.map(item => {
    // 1. Enforce price formatting: strictly "AMOUNT CURRENCY" e.g. "95.00 USD"
    const priceFormatted = `${Number(item.priceAmount).toFixed(2)} USD`;

    // 2. Base required fields
    const feedItem: OpenAIFeedItem = {
      item_id: item.itemId,
      title: item.title,
      description: item.description,
      url: item.url,
      brand: BRAND_NAME,
      seller_name: SELLER_NAME,
      image_url: item.imageUrl,
      availability: 'in_stock' as const,
      price: priceFormatted,
      target_countries: ['US'],
      store_country: 'US',

      // Recommended optional fields
      is_eligible_search: true,
      product_category: item.productCategory,
      seller_url: CANONICAL_SITE_URL,
      shipping_price: '0.00 USD',
      accepts_returns: false
    };

    // 3. Variant group fields (only for tiered variants)
    if (item.groupId) {
      feedItem.group_id = item.groupId;
      feedItem.listing_has_variations = true;
      feedItem.variant_dict = item.variantDict;
      feedItem.offer_id = item.offerId;
    } else if (item.offerId) {
      feedItem.offer_id = item.offerId;
    }

    // 4. Additional image URLs (omit key if empty)
    if (item.additionalImageUrls && item.additionalImageUrls.length > 0) {
      feedItem.additional_image_urls = item.additionalImageUrls;
    }

    return feedItem;
  });
}

/**
 * Serializes the product feed items into spec-compliant JSONL format.
 * Each line is a complete, single-line JSON object with no outer array.
 */
export function generateChatGPTProductFeedJSONL(): string {
  const items = generateChatGPTProductFeed();
  return items.map(item => JSON.stringify(item)).join('\n') + '\n';
}

/**
 * Returns the gzip-compressed binary buffer of the JSONL feed (.jsonl.gz).
 * Required by OpenAI for hosted JSONL URL feeds.
 */
export function generateChatGPTProductFeedGzip(): Buffer {
  const jsonl = generateChatGPTProductFeedJSONL();
  return zlib.gzipSync(Buffer.from(jsonl, 'utf8'), { level: 9 });
}

function escapeCsvCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const OPENAI_FEED_COLUMNS = [
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
] as const;

/**
 * Serializes the product feed items into spec-compliant CSV format with header row.
 * Accepted as uncompressed feed by OpenAI ChatGPT Product Feed Ingestion.
 */
export function generateChatGPTProductFeedCSV(): string {
  const items = generateChatGPTProductFeed();
  const rows: string[] = [OPENAI_FEED_COLUMNS.join(',')];

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

function escapeTsvCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return str.replace(/[\t\n\r]/g, ' ');
}

/**
 * Serializes the product feed items into spec-compliant TSV format with header row.
 * Accepted as uncompressed feed by OpenAI ChatGPT Product Feed Ingestion.
 */
export function generateChatGPTProductFeedTSV(): string {
  const items = generateChatGPTProductFeed();
  const rows: string[] = [OPENAI_FEED_COLUMNS.join('\t')];

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

/**
 * Dynamic DB-backed OpenAI ChatGPT Product Feed generator scoped to current BusinessProfile & ServiceOffering rows.
 * Dynamically imports business-context at runtime so static Node CLI feed tests continue cleanly without Next bundler aliases.
 */
export async function generateChatGPTProductFeedAsync(): Promise<OpenAIFeedItem[]> {
  const { getContractorContext, getDynamicServices } = await import('../business-context');
  const [ctx, services] = await Promise.all([
    getContractorContext(),
    getDynamicServices(),
  ]);

  if (!ctx.isConfiguredFromDb && !ctx.isColdStartEnv) {
    return generateChatGPTProductFeed();
  }

  const baseUrl = ctx.canonicalUrl.replace(/\/$/, '');
  const brandingObj = (ctx.branding as Record<string, any>) || {};
  const defaultImage =
    brandingObj.heroImageUrl ||
    brandingObj.logoUrl ||
    (ctx.isColdStartEnv ? `${baseUrl}/logo.svg` : `${baseUrl}/assets/images/Federal%20Way%20WA%20Junk%20and%20Trash%20Removal.png`);
  const additionalImages = [brandingObj.logoUrl, brandingObj.heroImageUrl].filter(
    (img): img is string => Boolean(img && img !== defaultImage && /^https?:\/\//i.test(img))
  );

  const volumeTiers: any[] = Array.isArray((ctx.pricing as any)?.volumeTiers)
    ? (ctx.pricing as any).volumeTiers
    : [];
  const loadRates: any[] = Array.isArray((ctx.pricing as any)?.loadRates)
    ? (ctx.pricing as any).loadRates
    : [];
  const tierSource = volumeTiers.length > 0 ? volumeTiers : loadRates;

  const loadItems: OpenAIFeedItem[] = tierSource.map((tier, idx) => {
    const label = tier.label || tier.title || tier.slug || `Tier ${idx + 1}`;
    const tierSlug = String(tier.id || tier.slug || label)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const price = Number(tier.basePrice ?? tier.minPrice ?? 95);
    return {
      item_id: `LOAD-${tierSlug.toUpperCase() || idx + 1}`,
      offer_id: `${ctx.trackerSlug || 'amzy'}-load-${tierSlug || idx + 1}`,
      group_id: 'MMJ-TRUCK-LOAD',
      listing_has_variations: true,
      variant_dict: { load_size: label },
      title: `${ctx.brandName} — ${label}`,
      description:
        tier.typicalItems ||
        tier.shortDescription ||
        `${label} upfront junk hauling service in ${ctx.city}, ${ctx.state}. Includes crew, loading, transport, and recycling.`,
      url: `${baseUrl}/services?load=${encodeURIComponent(tierSlug || String(idx + 1))}`,
      brand: ctx.brandName,
      seller_name: ctx.legalName,
      image_url: defaultImage,
      ...(additionalImages.length ? { additional_image_urls: additionalImages } : {}),
      availability: 'in_stock' as const,
      price: `${price.toFixed(2)} USD`,
      target_countries: ['US'],
      store_country: ctx.country || 'US',
      is_eligible_search: true,
      product_category: 'Home & Garden > Waste Management & Hauling > Junk Removal',
      seller_url: baseUrl,
      shipping_price: '0.00 USD',
      accepts_returns: false,
    };
  });

  const serviceItems: OpenAIFeedItem[] = services.map((svc, idx) => ({
    item_id: `SVC-${svc.slug.toUpperCase().replace(/[^A-Z0-9-]/g, '') || idx}`,
    offer_id: `${ctx.trackerSlug || 'amzy'}-${svc.slug}`,
    title: `${svc.name} in ${ctx.city}, ${ctx.state} | ${ctx.brandName}`,
    description: svc.shortDescription || `${svc.name} by ${ctx.brandName}.`,
    url: `${baseUrl}/services/${svc.slug}`,
    brand: ctx.brandName,
    seller_name: ctx.legalName,
    image_url: defaultImage,
    ...(additionalImages.length ? { additional_image_urls: additionalImages } : {}),
    availability: 'in_stock' as const,
    price: `${Number(svc.basePrice || 95).toFixed(2)} USD`,
    target_countries: ['US'],
    store_country: ctx.country || 'US',
    is_eligible_search: true,
    product_category: 'Home & Garden > Waste Management & Hauling > Junk Removal',
    seller_url: baseUrl,
    shipping_price: '0.00 USD',
    accepts_returns: false,
  }));

  const combined = [...loadItems, ...serviceItems];
  return combined.length > 0 ? combined : (ctx.isColdStartEnv ? [] : generateChatGPTProductFeed());
}

export async function generateChatGPTProductFeedJSONLAsync(): Promise<string> {
  const items = await generateChatGPTProductFeedAsync();
  return items.map((item) => JSON.stringify(item)).join('\n') + (items.length ? '\n' : '');
}

export async function generateChatGPTProductFeedGzipAsync(): Promise<Buffer> {
  const jsonl = await generateChatGPTProductFeedJSONLAsync();
  return zlib.gzipSync(Buffer.from(jsonl, 'utf8'), { level: 9 });
}

export async function generateChatGPTProductFeedCSVAsync(): Promise<string> {
  const items = await generateChatGPTProductFeedAsync();
  const rows: string[] = [OPENAI_FEED_COLUMNS.join(',')];
  items.forEach((item) => {
    rows.push(
      [
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
        escapeCsvCell(item.variant_dict || ''),
        escapeCsvCell(item.offer_id || ''),
        escapeCsvCell(item.is_eligible_search ? 'true' : 'false'),
        escapeCsvCell(item.product_category || ''),
        escapeCsvCell(item.seller_url || ''),
        escapeCsvCell(item.shipping_price || '0.00 USD'),
        escapeCsvCell(item.accepts_returns ? 'true' : 'false'),
        escapeCsvCell(item.additional_image_urls ? item.additional_image_urls.join(',') : ''),
      ].join(',')
    );
  });
  return rows.join('\n') + '\n';
}

export async function generateChatGPTProductFeedTSVAsync(): Promise<string> {
  const items = await generateChatGPTProductFeedAsync();
  const rows: string[] = [OPENAI_FEED_COLUMNS.join('\t')];
  items.forEach((item) => {
    rows.push(
      [
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
        escapeTsvCell(item.variant_dict || ''),
        escapeTsvCell(item.offer_id || ''),
        escapeTsvCell(item.is_eligible_search ? 'true' : 'false'),
        escapeTsvCell(item.product_category || ''),
        escapeTsvCell(item.seller_url || ''),
        escapeTsvCell(item.shipping_price || '0.00 USD'),
        escapeTsvCell(item.accepts_returns ? 'true' : 'false'),
        escapeTsvCell(item.additional_image_urls ? item.additional_image_urls.join(',') : ''),
      ].join('\t')
    );
  });
  return rows.join('\n') + '\n';
}
