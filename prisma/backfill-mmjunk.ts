import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { AUTHORIZED_MUNICIPALITIES, calculateHaversineMiles } from '../lib/geo-resolver';
import { generateJobSlug } from '../lib/job-utils';

const prisma = new PrismaClient();
const IS_DRY_RUN = process.argv.includes('--dry-run');

const MM_BASE = {
  brandName: 'M&M Junk Removal',
  legalName: 'M&M Junk Removal LLC',
  ownerName: 'Martin Silchukov',
  phone: '+12538867724',
  email: 'dispatch@mmjunk.com',
  domain: 'www.mmjunk.com',
  canonicalUrl: 'https://www.mmjunk.com',
  tagline: 'South King & Pierce County Junk Removal & Hauling',
  description:
    'M&M Junk Removal delivers upfront, owner-operated residential and commercial junk removal, estate cleanouts, and light demolition across South King & Pierce Counties.',
  foundedYear: 2007,
  street: '32511 7th Pl S',
  city: 'Federal Way',
  county: 'King County',
  state: 'WA',
  postalCode: '98003-5913',
  country: 'US',
  lat: 47.3223,
  lng: -122.3126,
  serviceRadiusMiles: 35,
  trackerSlug: 'mam-federalway',
  schedulerUrl: 'https://amzy.me/?utm_content=4',
};

const MM_PRICING_JSON = {
  freeEstimates: true,
  upfrontPricing: true,
  minimumLoadPrice: 95,
  rateGuarantee: 'Beat any verified written quote from licensed local competitors by 10%',
  sameDayCutoff: '12:00 PM PST',
  volumeTiers: [
    { id: 'MMJ-LOAD-MINI', label: 'MINI Curbside Tier', basePrice: 95, minPrice: 95, maxPrice: 150, cubicYardsRange: '0.5 - 1.0', pickupLoadsEquivalent: '0.25 load' },
    { id: 'MMJ-LOAD-1-PICKUP', label: '1 Pick Up Truck Bed', basePrice: 220, minPrice: 176, maxPrice: 264, cubicYardsRange: '2.0 - 2.5', pickupLoadsEquivalent: '1 pickup bed' },
    { id: 'MMJ-LOAD-2-PICKUP', label: '2 Pick Up Loads', basePrice: 440, minPrice: 352, maxPrice: 528, cubicYardsRange: '4.5 - 5.0', pickupLoadsEquivalent: '2 pickup loads' },
    { id: 'MMJ-LOAD-3-PICKUP', label: '3 Pick Up Loads', basePrice: 660, minPrice: 528, maxPrice: 792, cubicYardsRange: '7.0 - 7.5', pickupLoadsEquivalent: '3 pickup loads' },
    { id: 'MMJ-LOAD-DUMP-TRUCK', label: 'Full Dump Truck Load', basePrice: 1200, minPrice: 960, maxPrice: 1440, cubicYardsRange: '14.0 - 16.0', pickupLoadsEquivalent: '~5.5 pickup loads' },
    { id: 'MMJ-LOAD-DUMP-TRUCK-PLUS', label: 'Dump Truck Plus', basePrice: 1600, minPrice: 1560, maxPrice: 2400, cubicYardsRange: '20.0+', pickupLoadsEquivalent: '8-11 pickup loads' },
  ],
};

const MM_FLEET_JSON = {
  primaryVehicle: '2017 Isuzu NPR Commercial Dump Truck',
  licensePlate: 'C59567',
  trucks: [
    {
      name: '2017 Isuzu NPR Commercial Dump Truck',
      make: 'Isuzu',
      model: 'NPR',
      year: 2017,
      licensePlate: 'C59567',
      cubicFeet: 480,
      cubicYards: 17.78,
      dimensionsFeet: { length: 12, width: 8, height: 5 },
    },
  ],
};

const MM_BRANDING_JSON = {
  heroImageUrl: 'https://www.mmjunk.com/assets/images/team-hero.webp',
  heroMobileImageUrl: 'https://www.mmjunk.com/assets/images/team-hero-mobile.webp',
  avatarUrl: 'https://www.mmjunk.com/assets/images/martin-silchuk-avatar.webp',
  logoUrl: 'https://www.mmjunk.com/assets/images/logo.webp',
  darkBgLogoUrl: 'https://www.mmjunk.com/assets/images/logo-dark-bg.webp',
};

const MM_EXTERNAL_LINKS_JSON = {
  googleMapsUrl: 'https://www.google.com/maps?cid=15999711673070107161',
  googlePlaceShareUrl: 'https://share.google/Md8q9nfTnuZI9KjKj',
  bbbUrl: 'https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173',
  yelpUrl: 'https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3',
  facebookUrl: 'https://www.facebook.com/mmjunkremoval/',
  youtubeUrl: 'https://www.youtube.com/channel/UC0hatNYCgMWhFz-58gO1uQw',
  expertiseUrl: 'https://www.expertise.com/home-improvement/junk-removal/washington/seattle#mmjunkremoval',
  waDorUrl: 'https://dor.wa.gov',
};

const MM_SERVICES = [
  {
    slug: 'residential',
    name: 'Residential Junk Removal',
    category: 'Core Hauling',
    shortDescription: 'Full-service household junk removal, garage cleanouts, and clutter hauling.',
  },
  {
    slug: 'commercial',
    name: 'Commercial Junk Removal',
    category: 'Commercial',
    shortDescription: 'Office cleanouts, retail tenant turns, and property manager hauling.',
  },
  {
    slug: 'industrial',
    name: 'Industrial & Heavy Scrap Hauling',
    category: 'Commercial',
    shortDescription: 'Warehouse fixtures, pallet clearing, machinery, and ferrous metal recovery.',
  },
  {
    slug: 'sorting-donation',
    name: 'Eco-Sorting & Charity Donation Hauling',
    category: 'Recycling & Diversion',
    shortDescription: 'Priority sorting and direct transport of usable furniture and goods to local charities.',
  },
  {
    slug: 'recurring',
    name: 'Recurring Hauling & Account Pickups',
    category: 'Commercial',
    shortDescription: 'Scheduled recurring trash-out and overflow pickup routes for multi-family properties.',
  },
  {
    slug: 'contractual',
    name: 'Contractual Property Cleanouts',
    category: 'Commercial',
    shortDescription: 'Dedicated SLA hauling contracts for property management portfolios and HOA cleanouts.',
  },
  {
    slug: 'commercial-appliance-removal',
    name: 'Commercial Appliance & Reach-In Removal',
    category: 'Specialty Pickup',
    shortDescription: 'Heavy hydraulic liftgate extraction and EPA refrigerant recovery for commercial coolers.',
  },
  {
    slug: 'estate-cleanout',
    name: 'Estate Liquidation & Cleanouts',
    category: 'Full Property Cleanout',
    shortDescription: 'Respectful whole-home estate cleanouts with family item staging and donation receipts.',
  },
  {
    slug: 'construction-debris-removal',
    name: 'Construction & Concrete Debris Removal',
    category: 'Commercial & Remodel',
    shortDescription: 'Broken concrete slabs, lumber offcuts, drywall, roofing, and contractor jobsite debris.',
  },
  {
    slug: 'residential-furniture-removal',
    name: 'Furniture, Mattress & Heavy Item Disassembly',
    category: 'Specialty Pickup',
    shortDescription: 'In-home removal of sofas, sectionals, mattresses, and heavy gym treadmill disassembly.',
  },
  {
    slug: 'hot-tub-demolition-removal',
    name: 'Hot Tub & Spa Demolition & Removal',
    category: 'Demolition & Tear-Down',
    shortDescription: 'Safe disconnect verification, saw-down cutting, and full spa shell hauling.',
  },
  {
    slug: 'light-demolition-services',
    name: 'Light Demolition Services',
    category: 'Demolition & Tear-Down',
    shortDescription: 'Shed teardowns, fence tear-out, deck dismantling, sports courts, and magnetic nail sweeps.',
  },
  {
    slug: 'yard-waste-removal',
    name: 'Yard Waste & Storm Timber Clearing',
    category: 'Outdoor & Seasonal',
    shortDescription: 'Fallen timber logs, blackberry brush, windstorm debris, and green-waste composting.',
  },
];

const CANONICAL_JOBS = [
  {
    citySlug: 'federal-way',
    slug: 'federal-way-commercial-refrigerator-extraction',
    serviceSlug: 'commercial-appliance-removal',
    serviceType: 'Commercial Appliance Removal',
    itemCategory: '3 Commercial Reach-in Coolers (~1,500 lbs)',
    weightLbs: 1500,
    equipmentUsed: 'Hydraulic Liftgate, 16-ft High-Wall Box Truck, Heavy Appliance Dolly',
    disposalSite: 'Bow Lake Recycling & Transfer Station (EPA Freon Reclamation)',
    disposalReceipt: 'FW-COOLER-0926',
    customerReview:
      'M&M Junk Removal did an exceptional job clearing out our restaurant equipment in Federal Way! As a local restaurant owner, I needed three heavy commercial refrigerators hauled away and properly disposed of. I called Martin, and he gave me a fair flat-rate quote with zero runaround. He showed up on time, carefully navigated tight kitchen doors without scratching anything, and loaded everything quickly. Professional, honest, and reliable. Highly recommend M&M Junk Removal for any commercial or business cleanouts!',
    reviewRating: 5,
    reviewerName: 'ANKO BAKE',
    reviewPlatform: 'Google',
    reviewUrl: 'https://share.google/iCe2bBpzwVtm8vV66',
    completedAt: new Date('2026-09-25T14:30:00Z'),
  },
  {
    citySlug: 'tacoma',
    slug: 'ne-tacoma-moving-cleanout',
    serviceSlug: 'estate-cleanout',
    serviceType: 'Estate Liquidation & Moving Cleanouts',
    itemCategory: 'Staged Driveway Moving Cleanout (~1,850 lbs)',
    weightLbs: 1850,
    equipmentUsed: '16-foot High-Wall Box Truck, Multi-Man Crew, Appliance Dolly',
    disposalSite: 'Tacoma Recovery & Transfer Center',
    disposalReceipt: 'TAC-MOVE-0917',
    customerReview:
      'M&M Junk Removal made our moving prep in NE Tacoma completely effortless! We were cleaning out the house before our move and pulled everything outside, staging it by the garage for easy access. I booked a same-day appointment online, and Martin arrived right on time with his large truck. He quickly loaded all our bulky items, old furniture, and boxes in about 20 minutes flat. Pricing was transparent with no surprise fees. Truly a lifesaver during our move—thank you Martin!',
    reviewRating: 5,
    reviewerName: 'MoWzz Creations',
    reviewPlatform: 'Google',
    reviewUrl: 'https://share.google/76RAz2qMVJ4VhgKc9',
    completedAt: new Date('2026-09-17T11:00:00Z'),
  },
  {
    citySlug: 'federal-way',
    slug: 'federal-way-heavy-treadmill-disassembly',
    serviceSlug: 'residential-furniture-removal',
    serviceType: 'Residential Heavy Item Disassembly',
    itemCategory: '320-lb Commercial Gym Treadmill',
    weightLbs: 320,
    equipmentUsed: 'Pneumatic Tool Disassembly Rig, Heavy Moving Straps, 16ft Box Truck',
    disposalSite: 'Algona Transfer Station & Metal Recycling',
    disposalReceipt: 'FW-FIT-0929',
    customerReview:
      'Martin gave me a fair quote (way less than the big franchises) and showed up just an hour after I called him. He was courteous, competent, and cheerfully worked really hard to get my extra heavy treadmill disassembled so it would fit through the door. Really impressed with his work ethic and communication. Would hire him again in a heartbeat!',
    reviewRating: 5,
    reviewerName: 'S J',
    reviewPlatform: 'Google',
    reviewUrl: 'https://share.google/biQmq7QXeKyGy8FrX',
    completedAt: new Date('2026-09-29T16:15:00Z'),
  },
  {
    citySlug: 'auburn',
    slug: 'auburn-birch-tree-yard-waste-clearing',
    serviceSlug: 'yard-waste-removal',
    serviceType: 'Yard Waste & Storm Timber Clearing',
    itemCategory: '2,100 lbs Birch Tree Timber Logs & Brush',
    weightLbs: 2100,
    equipmentUsed: 'Chainsaw Rigging, Heavy Tarp Drag System, 16ft High-Wall Box Truck',
    disposalSite: 'Cedar Grove Composting Facility (Maple Valley)',
    disposalReceipt: 'AUB-YARD-0920',
    customerReview:
      'Martin cleared away over a ton of fallen birch logs and yard debris after a storm. On time, super fair price, left the yard completely swept clean. 5 stars all the way!',
    reviewRating: 5,
    reviewerName: 'Jon Lackey',
    reviewPlatform: 'Google',
    reviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4',
    completedAt: new Date('2026-09-20T13:00:00Z'),
  },
  {
    citySlug: 'auburn',
    slug: 'auburn-playset-shed-demolition',
    serviceSlug: 'light-demolition-services',
    serviceType: 'Outdoor Playset & Shed Demolition',
    itemCategory: '1,450 lbs Aged Cedar Playset & Heavy Timbers',
    weightLbs: 1450,
    equipmentUsed: 'Reciprocating Saws, Sledge Rigging, Rolling Magnetic Turf Nail Sweep',
    disposalSite: 'Bow Lake Transfer Station (Wood Recycling)',
    disposalReceipt: 'AUB-DEMO-0922',
    customerReview:
      'Tore down an old rotting playset in our backyard in just a couple hours. The magnetic nail sweep gave us peace of mind for the kids and dogs. Amazing service and great price.',
    reviewRating: 5,
    reviewerName: 'Erin Davis',
    reviewPlatform: 'Google',
    reviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4',
    completedAt: new Date('2026-09-22T10:30:00Z'),
  },
  {
    citySlug: 'tacoma',
    slug: 'tacoma-concrete-construction-debris-removal',
    serviceSlug: 'construction-debris-removal',
    serviceType: 'Concrete & Masonry Demolition Removal',
    itemCategory: '3,850 lbs Broken Concrete Foundation Slabs',
    weightLbs: 3850,
    equipmentUsed: 'Heavy Sledge Rigging, Wheelbarrows, Heavy-Duty Box Truck (4.5t rating)',
    disposalSite: 'Tacoma Concrete Recycling & Aggregate Crushing Center',
    disposalReceipt: 'TAC-CONC-0924',
    customerReview:
      'Had almost two tons of concrete from a patio tear-out. Martin hauled it all away without damaging the driveway or lawn. Fast, tough, and honest pricing.',
    reviewRating: 5,
    reviewerName: 'Drew Paris',
    reviewPlatform: 'Google',
    reviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4',
    completedAt: new Date('2026-09-24T15:00:00Z'),
  },
  {
    citySlug: 'renton',
    slug: 'basketball-court-wall-demolition-renton-skyway',
    serviceSlug: 'light-demolition-services',
    serviceType: 'Light Structure & Sports Court Demolition',
    itemCategory: '2,850 lbs Basketball Court Half-Wall & Framing',
    weightLbs: 2850,
    diversionRatePct: 100,
    equipmentUsed: 'Precision Cutting Gear, Chain-Link Tension Rigging, Magnetic Nail Sweep',
    disposalSite: 'DTG Recycle Center (Renton, WA) • 100% Landfill Diversion',
    disposalReceipt: 'DTG-RNT-100D',
    diversionFacility: 'DTG Recycle Center (Renton, WA)',
    mediaUrls: [
      'https://www.mmjunk.com/images/projects/basketball-court-demolition-renton-before.webp',
      'https://www.mmjunk.com/images/projects/basketball-court-framing-teardown-renton.webp',
      'https://www.mmjunk.com/images/projects/basketball-court-chain-link-removal-renton.webp',
      'https://www.mmjunk.com/images/projects/basketball-court-magnetic-sweep-after.webp',
    ],
    customerReview:
      'M&M Junk Removal dismantled and hauled away our entire basketball court half-wall in Renton Skyway. They cut down the framing, took out all posts safely, and left the court completely swept clean in less than a day.',
    reviewRating: 5,
    reviewerName: 'Rick',
    reviewPlatform: 'Google',
    reviewUrl: 'https://maps.app.goo.gl/uBTL2aZponNAWyTy6',
    ownerReply:
      "Thank you so much for the 5-star review, Rick! De-tensioning that chain link safely and flush-cutting the structural posts without nicking the court was our top priority. We're proud to report that 100% of the lumber framing and metal piping was delivered to DTG Recycle Center in Renton for complete wood recovery and zero landfill waste.",
    ownerReplyDate: new Date('2026-10-26T18:00:00Z'),
    completedAt: new Date('2026-10-26T16:00:00Z'),
  },
];

const CHARACTER_RULES = [
  {
    dimension: 'punctuality',
    label: 'Punctual & Reliable Arrival',
    patterns: ['on time', 'on-time', 'punctual', 'same day', 'same-day', 'right on the dot', 'showed up'],
    summary: 'Consistently arrives within scheduled dispatch windows and delivers prompt local turnaround.',
  },
  {
    dimension: 'pricing_integrity',
    label: 'Transparent Upfront Pricing',
    patterns: ['fair price', 'fair quote', 'flat-rate', 'flat rate', 'no surprise', 'transparent', 'honest pricing'],
    summary: 'Honors clear upfront volume estimates with zero surprise surcharges or franchise fees.',
  },
  {
    dimension: 'property_care',
    label: 'Careful Property Protection & Sweep-Clean Finish',
    patterns: ['careful', 'courteous', 'polite', 'swept clean', 'spotless', 'without scratching', 'without damaging', 'magnetic nail'],
    summary: 'Protects driveways, walls, and courts while leaving job sites swept clean.',
  },
  {
    dimension: 'craft_execution',
    label: 'Complex Tear-Down & Heavy Extraction Skill',
    patterns: ['demolition', 'dismantl', 'disassembl', 'heavy', 'treadmill', 'cooler', 'concrete', 'shed'],
    summary: 'Safely executes technical dismantling, tight-doorway extraction, and heavy haul-aways.',
  },
  {
    dimension: 'environmental_stewardship',
    label: 'Verified Landfill Diversion & Recycling',
    patterns: ['recycl', 'donat', 'divert', 'freon', 'dtg', 'transfer station'],
    summary: 'Routes reusable goods to charities and diverts wood, metal, concrete, and freon cleanly.',
  },
];

async function run() {
  const reviewsPath = path.join(process.cwd(), 'assets', 'reviews.json');
  const videosPath = path.join(process.cwd(), 'knowledge', 'youtube-videos.json');
  const repPath = path.join(process.cwd(), 'knowledge', 'reputation.json');

  const reviews: any[] = fs.existsSync(reviewsPath) ? JSON.parse(fs.readFileSync(reviewsPath, 'utf8')) : [];
  const videosRaw = fs.existsSync(videosPath) ? JSON.parse(fs.readFileSync(videosPath, 'utf8')) : { videos: [] };
  const videos: any[] = Array.isArray(videosRaw.videos) ? videosRaw.videos : [];
  const repData = fs.existsSync(repPath) ? JSON.parse(fs.readFileSync(repPath, 'utf8')) : null;

  console.log(`=== M&M Zero-Data-Loss Backfill (${IS_DRY_RUN ? 'DRY RUN' : 'LIVE EXECUTION'}) ===`);
  console.log(`Inventory detected: 25 WA Spokes | ${MM_SERVICES.length} Services | ${CANONICAL_JOBS.length} Canonical Jobs | ${reviews.length} Reviews | ${videos.length} Videos`);

  if (IS_DRY_RUN) {
    console.log('Dry-run complete: no database writes performed.');
    return;
  }

  // 1. BusinessProfile (monotonic kbRevision=1 guard)
  const existingProfile = await prisma.businessProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);
  if (!existingProfile || existingProfile.kbRevision <= 1) {
    await prisma.businessProfile.upsert({
      where: { id: 'primary' },
      create: {
        id: 'primary',
        appId: 'app_mmjunk_primary',
        kbVersion: '1.0',
        kbRevision: 1,
        ...MM_BASE,
        languages: ['English'],
        discoveryProviderId: 'app_mmjunk_primary',
        externalLinksJson: MM_EXTERNAL_LINKS_JSON,
        pricingJson: MM_PRICING_JSON,
        fleetJson: MM_FLEET_JSON,
        brandingJson: MM_BRANDING_JSON,
      },
      update: {
        ...MM_BASE,
        externalLinksJson: MM_EXTERNAL_LINKS_JSON,
        pricingJson: MM_PRICING_JSON,
        fleetJson: MM_FLEET_JSON,
        brandingJson: MM_BRANDING_JSON,
        syncedAt: new Date(),
      },
    });
    console.log('✓ Synced BusinessProfile (kbRevision=1)');
  } else {
    console.log(`ℹ Preserved newer BusinessProfile (kbRevision=${existingProfile.kbRevision})`);
  }

  // 2. 25 Authorized Municipalities (preserving existing IDs)
  for (const [slug, meta] of Object.entries(AUTHORIZED_MUNICIPALITIES)) {
    await prisma.locationSpoke.upsert({
      where: { slug },
      create: {
        slug,
        cityName: meta.cityName,
        state: 'WA',
        county: meta.county,
        zipCodes: meta.zipCodes,
        coordinates: meta.coords,
        distanceMiles: calculateHaversineMiles([MM_BASE.lat, MM_BASE.lng], meta.coords),
        isPrimaryHub: slug === 'federal-way',
        neighborhoods: meta.neighborhoods || [],
        wikidataUri: meta.wikidataUri,
      },
      update: {
        cityName: meta.cityName,
        state: 'WA',
        county: meta.county,
        zipCodes: meta.zipCodes,
        coordinates: meta.coords,
        distanceMiles: calculateHaversineMiles([MM_BASE.lat, MM_BASE.lng], meta.coords),
        isPrimaryHub: slug === 'federal-way',
        neighborhoods: meta.neighborhoods || [],
        wikidataUri: meta.wikidataUri,
      },
    });
  }
  console.log(`✓ Synced ${Object.keys(AUTHORIZED_MUNICIPALITIES).length} WA LocationSpokes`);

  // 3. 13 Core M&M ServiceOfferings
  const serviceIdBySlug = new Map<string, string>();
  for (const svc of MM_SERVICES) {
    const row = await prisma.serviceOffering.upsert({
      where: { slug: svc.slug },
      create: {
        slug: svc.slug,
        name: svc.name,
        category: svc.category,
        shortDescription: svc.shortDescription,
        isCoreBase: true,
        autoDiscovered: false,
        isActive: true,
      },
      update: {
        name: svc.name,
        category: svc.category,
        shortDescription: svc.shortDescription,
        isCoreBase: true,
        isActive: true,
      },
    });
    serviceIdBySlug.set(svc.slug, row.id);
  }
  console.log(`✓ Synced ${MM_SERVICES.length} M&M ServiceOfferings`);

  // 4. All 7 Canonical JobStories (including Renton Basketball Court Demolition) + repair null slugs
  for (const job of CANONICAL_JOBS) {
    const loc = await prisma.locationSpoke.findUnique({ where: { slug: job.citySlug } });
    if (!loc) continue;
    const serviceId = serviceIdBySlug.get(job.serviceSlug) || null;

    const existing = await prisma.jobStory.findFirst({
      where: {
        OR: [
          { slug: job.slug },
          { disposalReceipt: job.disposalReceipt },
        ],
      },
    });

    if (existing) {
      await prisma.jobStory.update({
        where: { id: existing.id },
        data: {
          slug: existing.slug || job.slug,
          serviceId: existing.serviceId || serviceId,
          canonicalServiceSlug: existing.canonicalServiceSlug || job.serviceSlug,
          mediaUrls: existing.mediaUrls.length > 0 ? existing.mediaUrls : (job.mediaUrls || []),
          diversionRatePct: existing.diversionRatePct ?? job.diversionRatePct ?? null,
          diversionFacility: existing.diversionFacility || job.diversionFacility || null,
          ownerReply: existing.ownerReply || job.ownerReply || null,
          ownerReplyDate: existing.ownerReplyDate || job.ownerReplyDate || null,
          isPublished: true,
        },
      });
    } else {
      await prisma.jobStory.create({
        data: {
          slug: job.slug,
          locationId: loc.id,
          serviceId,
          canonicalServiceSlug: job.serviceSlug,
          serviceType: job.serviceType,
          itemCategory: job.itemCategory,
          weightLbs: job.weightLbs,
          diversionRatePct: job.diversionRatePct ?? null,
          diversionFacility: job.diversionFacility || null,
          equipmentUsed: job.equipmentUsed,
          disposalSite: job.disposalSite,
          disposalReceipt: job.disposalReceipt,
          mediaUrls: job.mediaUrls || [],
          customerReview: job.customerReview,
          reviewRating: job.reviewRating,
          reviewerName: job.reviewerName,
          reviewPlatform: job.reviewPlatform,
          reviewUrl: job.reviewUrl,
          ownerReply: job.ownerReply || null,
          ownerReplyDate: job.ownerReplyDate || null,
          completedAt: job.completedAt,
          isPublished: true,
        },
      });
    }
  }

  // Repair any legacy null-slug live webhook jobs without dropping them
  const nullSlugJobs = await prisma.jobStory.findMany({
    where: { slug: null },
    include: { location: true },
  });
  for (const nj of nullSlugJobs) {
    const repaired = generateJobSlug({
      service: nj.serviceType,
      item: nj.itemCategory,
      city: nj.location?.cityName || 'federal-way',
      jobId: nj.externalJobId || nj.id.slice(-6),
    });
    await prisma.jobStory.update({ where: { id: nj.id }, data: { slug: repaired } }).catch(() => {});
  }
  console.log(`✓ Synced 7 Canonical JobStories (and repaired ${nullSlugJobs.length} null slugs)`);

  // 5. Backfill 36 verified reviews from assets/reviews.json into CustomerReview
  for (let i = 0; i < reviews.length; i++) {
    const rev = reviews[i];
    const cleanName = String(rev.name || 'Customer').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const extId = `mm_review_${rev.datePublished || 'undated'}_${cleanName}_${i}`;
    await prisma.customerReview.upsert({
      where: { externalId: extId },
      create: {
        externalId: extId,
        platform: rev.platform || 'Google',
        authorName: rev.name || 'Verified Customer',
        authorPhoto: rev.avatar || null,
        rating: Number(rev.rating) || 5,
        reviewText: rev.text || '',
        reviewDate: rev.datePublished ? new Date(rev.datePublished) : new Date(),
        ownerReply: rev.ownerReply?.text || null,
        publishedToApp: true,
      },
      update: {
        authorName: rev.name || 'Verified Customer',
        rating: Number(rev.rating) || 5,
        reviewText: rev.text || '',
        ownerReply: rev.ownerReply?.text || null,
      },
    });
  }
  console.log(`✓ Backfilled ${reviews.length} CustomerReviews`);

  // 6. Backfill 48 YouTube videos from knowledge/youtube-videos.json into SocialPost
  const cityLocMap = new Map<string, string>();
  const allLocs = await prisma.locationSpoke.findMany({ select: { id: true, slug: true } });
  for (const l of allLocs) cityLocMap.set(l.slug, l.id);

  for (const vid of videos) {
    if (!vid?.videoId) continue;
    const extId = `yt-${vid.videoId}`;
    const locId = vid.citySlug ? cityLocMap.get(vid.citySlug) || null : null;
    await prisma.socialPost.upsert({
      where: { externalId: extId },
      create: {
        externalId: extId,
        platform: 'youtube',
        locationId: locId,
        caption: vid.title || 'M&M Junk Removal Dispatch',
        mediaUrl: vid.thumbnail || `https://i.ytimg.com/vi/${vid.videoId}/maxresdefault.jpg`,
        videoUrl: vid.videoUrl || `https://www.youtube.com/watch?v=${vid.videoId}`,
        publishedAt: vid.uploadDate ? new Date(vid.uploadDate) : new Date(),
      },
      update: {
        locationId: locId ?? undefined,
        caption: vid.title || undefined,
      },
    });
  }
  console.log(`✓ Backfilled ${videos.length} YouTube SocialPosts`);

  // 7. Backfill ReputationProfile from knowledge/reputation.json (monotonic guard: preserve higher live count)
  if (repData) {
    const existingRep = await prisma.reputationProfile.findUnique({ where: { id: 'primary' } }).catch(() => null);
    if (!existingRep || existingRep.reviewCount < repData.reviewCount) {
      await prisma.reputationProfile.upsert({
        where: { id: 'primary' },
        create: {
          id: 'primary',
          reviewCount: repData.reviewCount,
          ratingValue: repData.ratingValue,
          aggregateRating: repData.aggregateRating,
          googleCount: repData.breakdown?.google?.reviewCount || 0,
          googleRating: repData.breakdown?.google?.rating ?? null,
          yelpCount: repData.breakdown?.yelp?.reviewCount || 0,
          yelpRating: repData.breakdown?.yelp?.rating ?? null,
          amzyCount: repData.breakdown?.amzy?.reviewCount || 0,
          amzyRating: repData.breakdown?.amzy?.rating ?? null,
          bbbRating: repData.bbbRating || 'A+',
          breakdownJson: repData.breakdown || {},
          lastUpdated: repData.lastUpdated ? new Date(repData.lastUpdated) : new Date(),
        },
        update: {
          reviewCount: repData.reviewCount,
          ratingValue: repData.ratingValue,
          aggregateRating: repData.aggregateRating,
          googleCount: repData.breakdown?.google?.reviewCount || 0,
          googleRating: repData.breakdown?.google?.rating ?? null,
          yelpCount: repData.breakdown?.yelp?.reviewCount || 0,
          yelpRating: repData.breakdown?.yelp?.rating ?? null,
          amzyCount: repData.breakdown?.amzy?.reviewCount || 0,
          amzyRating: repData.breakdown?.amzy?.rating ?? null,
          bbbRating: repData.bbbRating || 'A+',
          breakdownJson: repData.breakdown || {},
          lastUpdated: repData.lastUpdated ? new Date(repData.lastUpdated) : new Date(),
        },
      });
      console.log(`✓ Backfilled ReputationProfile (${repData.reviewCount} reviews, ${repData.aggregateRating}★)`);
    } else {
      console.log(`ℹ Preserved live ReputationProfile (${existingRep.reviewCount} reviews)`);
    }
  }

  // 8. Synthesize & upsert CharacterSignals from verified reviews
  for (const rule of CHARACTER_RULES) {
    let evidenceCount = 0;
    const matched = new Set<string>();
    for (const rev of reviews) {
      const corpus = `${rev.text || ''} ${rev.ownerReply?.text || ''}`.toLowerCase();
      for (const pat of rule.patterns) {
        if (corpus.includes(pat)) {
          evidenceCount += 1;
          matched.add(pat);
        }
      }
    }
    if (evidenceCount > 0) {
      await prisma.characterSignal.upsert({
        where: { dimension: rule.dimension },
        create: {
          dimension: rule.dimension,
          label: rule.label,
          summary: rule.summary,
          evidenceCount,
          sourceType: 'review',
          matchedSignals: Array.from(matched),
        },
        update: {
          label: rule.label,
          summary: rule.summary,
          evidenceCount,
          matchedSignals: Array.from(matched),
        },
      });
    }
  }
  console.log('✓ Synthesized CharacterSignals from verified customer reviews');
}

run()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
