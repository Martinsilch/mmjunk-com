const BRAND_NAME = 'M&M Junk Removal';
const SELLER_NAME = 'M&M Junk Removal Service';
const CANONICAL_SITE_URL = 'https://www.mmjunk.com';
const PRIMARY_HERO_IMAGE = `${CANONICAL_SITE_URL}/assets/images/Federal%20Way%20WA%20Junk%20and%20Trash%20Removal.png`;

const RAW_CATALOG_DATA = [
  // =========================================================================
  // VARIANT GROUP: Truck Load Volume Tiers (group_id: MMJ-TRUCK-LOAD)
  // Base: $220 per pickup truck load (+/- 30% range), Dump truck = $1,200 (~5.5 loads)
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
    description: 'Standard pickup truck bed volume capacity (approx. 4x8x2 ft bed). Base rate: $220 (ballpark range $154 - $286). Ideal for a 3-piece couch, mattress + box spring set, dining set, or 8-12 bagged household items. Includes two-person crew, loading, transport, and certified recycling across South King and Pierce Counties, WA.',
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
    description: 'Double pickup truck capacity. Base rate: $440 (ballpark range $308 - $572). Ideal for studio cleanouts, sectional sofas, garage clutter, yard debris piles, or light remodel scrap. Includes complete heavy lifting, sorting, sweep-up, hauling, and recycling across South King and Pierce Counties, WA.',
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
    description: 'Triple pickup truck capacity. Base rate: $660 (ballpark range $462 - $858). Perfect for multi-room home purges, basement or attic cleanouts, substantial yard clearing, or moderate contractor remodel debris. Includes full two-person loading, hauling, and eco-friendly diversion across South King and Pierce Counties, WA.',
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
    description: 'Full high-capacity hauling dump truck volume (approx. 5.5 pickup truck loads, rated up to 4.5 tons payload). Base rate: $1,200 (ballpark range $840 - $1,560). Ideal for garage overhauls, whole-home 2-3 bedroom cleanouts, roofing tear-off, or commercial office clearances across South King and Pierce Counties, WA.',
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
    description: 'Pickup and hauling of fallen tree branches, timber logs, shrub clippings, brush piles, and organic storm debris across South King and Pierce Counties, WA. Starting rate from $85 per cubic yard. 100% diverted from landfills to certified regional composting facilities for organic soil blending.',
    url: `${CANONICAL_SITE_URL}/services/yard-waste-removal`,
    imageUrl: `${CANONICAL_SITE_URL}/assets/images/Yard%20Trash%20Removal%20in%20Milton,%20WA.png`,
    additionalImageUrls: [PRIMARY_HERO_IMAGE],
    priceAmount: '85.00',
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

module.exports = {
  BRAND_NAME,
  SELLER_NAME,
  CANONICAL_SITE_URL,
  PRIMARY_HERO_IMAGE,
  RAW_CATALOG_DATA
};
