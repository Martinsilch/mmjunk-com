import { PrismaClient } from '@prisma/client';
import { AUTHORIZED_MUNICIPALITIES } from '../lib/geo-resolver';

const prisma = new PrismaClient();

const VERIFIED_JOBS = [
  {
    citySlug: 'federal-way',
    serviceType: 'Commercial Appliance Removal',
    itemCategory: '3 Commercial Reach-in Coolers (~1,500 lbs)',
    weightLbs: 1500,
    equipmentUsed: 'Hydraulic Liftgate, 16-ft High-Wall Box Truck, Heavy Appliance Dolly',
    disposalSite: 'Bow Lake Recycling & Transfer Station (EPA Freon Reclamation)',
    disposalReceipt: 'FW-COOLER-0926',
    customerReview: 'M&M Junk Removal did an exceptional job clearing out our restaurant equipment in Federal Way! As a local restaurant owner, I needed three heavy commercial refrigerators hauled away and properly disposed of. I called Martin, and he gave me a fair flat-rate quote with zero runaround. He showed up on time, carefully navigated tight kitchen doors without scratching anything, and loaded everything quickly. Professional, honest, and reliable. Highly recommend M&M Junk Removal for any commercial or business cleanouts!',
    reviewRating: 5,
    reviewerName: 'ANKO BAKE',
    reviewPlatform: 'Google',
    reviewUrl: 'https://share.google/iCe2bBpzwVtm8vV66',
    completedAt: new Date('2026-09-25T14:30:00Z')
  },
  {
    citySlug: 'tacoma',
    serviceType: 'Estate Liquidation & Moving Cleanouts',
    itemCategory: 'Staged Driveway Moving Cleanout (~1,850 lbs)',
    weightLbs: 1850,
    equipmentUsed: '16-foot High-Wall Box Truck, Multi-Man Crew, Appliance Dolly',
    disposalSite: 'Tacoma Recovery & Transfer Center',
    disposalReceipt: 'TAC-MOVE-0917',
    customerReview: 'M&M Junk Removal made our moving prep in NE Tacoma completely effortless! We were cleaning out the house before our move and pulled everything outside, staging it by the garage for easy access. I booked a same-day appointment online, and Martin arrived right on time with his large truck. He quickly loaded all our bulky items, old furniture, and boxes in about 20 minutes flat. Pricing was transparent with no surprise fees. Truly a lifesaver during our move—thank you Martin!',
    reviewRating: 5,
    reviewerName: 'MoWzz Creations',
    reviewPlatform: 'Google',
    reviewUrl: 'https://share.google/76RAz2qMVJ4VhgKc9',
    completedAt: new Date('2026-09-17T11:00:00Z')
  },
  {
    citySlug: 'federal-way',
    serviceType: 'Residential Heavy Item Disassembly',
    itemCategory: '320-lb Commercial Gym Treadmill',
    weightLbs: 320,
    equipmentUsed: 'Pneumatic Tool Disassembly Rig, Heavy Moving Straps, 16ft Box Truck',
    disposalSite: 'Algona Transfer Station & Metal Recycling',
    disposalReceipt: 'FW-FIT-0929',
    customerReview: 'Martin gave me a fair quote (way less than the big franchises) and showed up just an hour after I called him. He was courteous, competent, and cheerfully worked really hard to get my extra heavy treadmill disassembled so it would fit through the door. Really impressed with his work ethic and communication. Would hire him again in a heartbeat!',
    reviewRating: 5,
    reviewerName: 'S J',
    reviewPlatform: 'Google',
    reviewUrl: 'https://share.google/biQmq7QXeKyGy8FrX',
    completedAt: new Date('2026-09-29T16:15:00Z')
  },
  {
    citySlug: 'auburn',
    serviceType: 'Yard Waste & Storm Timber Clearing',
    itemCategory: '2,100 lbs Birch Tree Timber Logs & Brush',
    weightLbs: 2100,
    equipmentUsed: 'Chainsaw Rigging, Heavy Tarp Drag System, 16ft High-Wall Box Truck',
    disposalSite: 'Cedar Grove Composting Facility (Maple Valley)',
    disposalReceipt: 'AUB-YARD-0920',
    customerReview: 'Martin cleared away over a ton of fallen birch logs and yard debris after a storm. On time, super fair price, left the yard completely swept clean. 5 stars all the way!',
    reviewRating: 5,
    reviewerName: 'Jon Lackey',
    reviewPlatform: 'Google',
    reviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4',
    completedAt: new Date('2026-09-20T13:00:00Z')
  },
  {
    citySlug: 'auburn',
    serviceType: 'Outdoor Playset & Shed Demolition',
    itemCategory: '1,450 lbs Aged Cedar Playset & Heavy Timbers',
    weightLbs: 1450,
    equipmentUsed: 'Reciprocating Saws, Sledge Rigging, Rolling Magnetic Turf Nail Sweep',
    disposalSite: 'Bow Lake Transfer Station (Wood Recycling)',
    disposalReceipt: 'AUB-DEMO-0922',
    customerReview: 'Tore down an old rotting playset in our backyard in just a couple hours. The magnetic nail sweep gave us peace of mind for the kids and dogs. Amazing service and great price.',
    reviewRating: 5,
    reviewerName: 'Erin Davis',
    reviewPlatform: 'Google',
    reviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4',
    completedAt: new Date('2026-09-22T10:30:00Z')
  },
  {
    citySlug: 'tacoma',
    serviceType: 'Concrete & Masonry Demolition Removal',
    itemCategory: '3,850 lbs Broken Concrete Foundation Slabs',
    weightLbs: 3850,
    equipmentUsed: 'Heavy Sledge Rigging, Wheelbarrows, Heavy-Duty Box Truck (4.5t rating)',
    disposalSite: 'Tacoma Concrete Recycling & Aggregate Crushing Center',
    disposalReceipt: 'TAC-CONC-0924',
    customerReview: 'Had almost two tons of concrete from a patio tear-out. Martin hauled it all away without damaging the driveway or lawn. Fast, tough, and honest pricing.',
    reviewRating: 5,
    reviewerName: 'Drew Paris',
    reviewPlatform: 'Google',
    reviewUrl: 'https://search.google.com/local/reviews?placeid=ChIJAcpZtwpXkFQRGSpNEcXWFt4',
    completedAt: new Date('2026-09-24T15:00:00Z')
  }
];

async function main() {
  console.log('--- 1. Seeding 25 Authorized King & Pierce County Municipalities ---');
  
  for (const [slug, meta] of Object.entries(AUTHORIZED_MUNICIPALITIES)) {
    const spoke = await prisma.locationSpoke.upsert({
      where: { slug },
      update: {
        cityName: meta.cityName,
        county: meta.county,
        zipCodes: meta.zipCodes,
        coordinates: meta.coords,
        wikidataUri: meta.wikidataUri
      },
      create: {
        slug,
        cityName: meta.cityName,
        county: meta.county,
        zipCodes: meta.zipCodes,
        coordinates: meta.coords,
        wikidataUri: meta.wikidataUri
      }
    });
    console.log(`  ✓ Synced Spoke: ${spoke.cityName}, WA (${spoke.slug}) [${spoke.county}]`);
  }

  console.log('\n--- 2. Migrating Verified Telemetry Job Stories ---');
  for (const job of VERIFIED_JOBS) {
    const location = await prisma.locationSpoke.findUnique({
      where: { slug: job.citySlug }
    });

    if (!location) {
      console.warn(`  ⚠️ Warning: Location spoke not found for slug: ${job.citySlug}`);
      continue;
    }

    // Check if job story already exists by disposal receipt or review
    const existing = await prisma.jobStory.findFirst({
      where: {
        locationId: location.id,
        disposalReceipt: job.disposalReceipt
      }
    });

    if (!existing) {
      await prisma.jobStory.create({
        data: {
          locationId: location.id,
          serviceType: job.serviceType,
          itemCategory: job.itemCategory,
          weightLbs: job.weightLbs,
          equipmentUsed: job.equipmentUsed,
          disposalSite: job.disposalSite,
          disposalReceipt: job.disposalReceipt,
          customerReview: job.customerReview,
          reviewRating: job.reviewRating,
          reviewerName: job.reviewerName,
          reviewPlatform: job.reviewPlatform,
          reviewUrl: job.reviewUrl,
          completedAt: job.completedAt
        }
      });
      console.log(`  ✓ Ingested Job Story: ${job.serviceType} in ${location.cityName} (${job.reviewerName})`);
    } else {
      console.log(`  ℹ Already Present: ${job.serviceType} in ${location.cityName}`);
    }
  }

  const spokeCount = await prisma.locationSpoke.count();
  const jobCount = await prisma.jobStory.count();
  console.log(`\n🎉 Seed Completed: ${spokeCount} Spokes, ${jobCount} Job Stories ready.`);
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
