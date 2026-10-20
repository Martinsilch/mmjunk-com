import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';
import { getReputationMetrics } from '@/lib/reputation';

interface PageProps {
  params: { slug: string };
}

export const revalidate = false; // Relies on on-demand revalidateTag()
export const dynamicParams = true; // Allows newly ingested municipalities to generate on demand

export async function generateStaticParams() {
  const slugs = new Set<string>(Object.keys(AUTHORIZED_MUNICIPALITIES));
  try {
    const spokes = await db.locationSpoke.findMany({ select: { slug: true } });
    for (const s of spokes) {
      slugs.add(s.slug);
    }
  } catch {
    // Database offline during initial static generation
  }

  return Array.from(slugs).map(slug => ({
    slug: `junk-removal-${slug}-wa`
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawSlug = params?.slug || '';
  if (!rawSlug.startsWith('junk-removal-') || !rawSlug.endsWith('-wa')) {
    return { title: 'M&M Junk Removal' };
  }

  const cleanSlug = rawSlug.replace(/^junk-removal-/, '').replace(/-wa$/, '');
  const meta = AUTHORIZED_MUNICIPALITIES[cleanSlug];
  const spoke = cleanSlug ? await db.locationSpoke.findUnique({ where: { slug: cleanSlug } }).catch(() => null) : null;
  const cityName = spoke?.cityName || meta?.cityName || cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (cleanSlug === 'federal-way') {
    return {
      title: 'Junk Removal Federal Way WA | Fast Local Hauling | M&M Junk Removal',
      description: 'Local junk removal in Federal Way, WA. Same-day appliance removal, cleanouts & yard waste hauling across Twin Lakes, Redondo & Campus. Free upfront quote!',
      alternates: {
        canonical: 'https://www.mmjunk.com/junk-removal-federal-way-wa/'
      }
    };
  }

  const neighborhoodSample = meta?.neighborhoods?.slice(0, 3).join(', ');
  const geoContext = neighborhoodSample ? ` across ${neighborhoodSample} & nearby areas` : '';

  return {
    title: `Junk Removal ${cityName} WA | Fast Local Hauling | M&M Junk Removal`,
    description: `Local junk removal in ${cityName}, WA. Same-day appliance removal, cleanouts & yard waste hauling${geoContext}. Upfront flat-rate quote! Call (253) 886-7724.`,
    alternates: {
      canonical: `https://www.mmjunk.com/junk-removal-${cleanSlug}-wa/`
    }
  };
}

export default async function DynamicSpokePage({ params }: PageProps) {
  const rawSlug = params?.slug || '';
  if (!rawSlug.startsWith('junk-removal-') || !rawSlug.endsWith('-wa')) {
    notFound();
  }

  const cleanSlug = rawSlug.replace(/^junk-removal-/, '').replace(/-wa$/, '');
  const meta = AUTHORIZED_MUNICIPALITIES[cleanSlug];

  const spoke = cleanSlug ? await db.locationSpoke.findUnique({
    where: { slug: cleanSlug },
    include: {
      jobs: {
        orderBy: { completedAt: 'desc' },
        take: 15
      },
      socialPosts: {
        orderBy: { publishedAt: 'desc' },
        take: 6
      }
    }
  }).catch(() => null) : null;

  // Resolve municipality metadata with resilient fallbacks
  const cityName = spoke?.cityName || meta?.cityName || cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const county = spoke?.county || meta?.county || 'King County';
  const zipCodes = (spoke?.zipCodes && spoke.zipCodes.length > 0) ? spoke.zipCodes : (meta?.zipCodes || ['98001']);
  const wikidataUri = spoke?.wikidataUri || meta?.wikidataUri || 'https://www.wikidata.org/wiki/Q852586';
  const jobs = spoke?.jobs || [];
  
  // Hyper-local geographic contextual datasets
  const neighborhoods = meta?.neighborhoods || [
    'Twin Lakes', 'Campus Reserve', 'Marine Hills', 'Mirror Lake',
    'Lakota & Buenna', 'Adelaide', 'Steel Lake', 'Redondo'
  ];
  const corridors = meta?.majorCorridors || [
    'Pacific Hwy S (Hwy 99)', 'SR-18', 'SW Campus Dr', 'SW 320th St near The Commons'
  ];
  const transferStation = meta?.transferStation || (county === 'King County' ? 'King County Algona Transfer Station & Bow Lake Recycling' : 'Pierce County Transfer Facility');
  const donationPartners = meta?.donationPartners || ['Federal Way St. Vincent de Paul', 'Federal Way Goodwill'];

  let socialPosts = spoke?.socialPosts || [];
  if (socialPosts.length === 0) {
    socialPosts = await db.socialPost.findMany({
      where: {
        OR: [
          { locationId: null },
          { location: { slug: 'federal-way' } }
        ]
      },
      orderBy: { publishedAt: 'desc' },
      take: 4
    }).catch(() => []);
  }

  if (!cityName) {
    notFound();
  }

  const HUB_PHONE = '+1-253-886-7724';
  const HUB_URL = 'https://www.mmjunk.com';
  const AMZY_BOOKING_URL = 'https://amzy.me/?utm_content=4';
  const reputation = getReputationMetrics();

  const faqItems = [
    {
      q: `How does your pricing work for ${cityName} pickups?`,
      a: `We quote upfront flat rates based strictly on the volume of space your items occupy in our high-wall hauling truck. Baseline curbside pickups start at $95 (MINI), standard pickup truck loads run $140–$230, and full truckloads are $740–$1,110. All labor, loading, and transfer station disposal fees are included with zero franchise royalty surcharges.`
    },
    {
      q: `Where does our junk go after pickup in ${cityName}?`,
      a: `Usable furniture, household goods, and working appliances are sorted and diverted to local charities like ${donationPartners.join(' and ')}. Unusable materials are hauled directly to certified regional transfer stations (${transferStation}) in full compliance with ${county} environmental regulations.`
    },
    {
      q: `How soon can you haul away my junk in ${cityName}?`,
      a: `We frequently offer same-day and next-day pickup windows across ${cityName}. You can call dispatch directly at (253) 886-7724 or lock in your appointment in 30 seconds through our live AMZY booking calendar.`
    },
    {
      q: `Do you handle refrigerator and appliance freon reclamation in ${cityName}?`,
      a: `Yes. All cooling appliances (refrigerators, freezers, AC units) are handled in strict accordance with EPA refrigerant guidelines and transferred to certified facilities equipped for safe freon recovery.`
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'HomeAndConstructionBusiness', 'RecyclingCenter'],
        '@id': `${HUB_URL}/junk-removal-${cleanSlug}-wa/#business`,
        'name': `M&M Junk Removal - ${cityName}`,
        'parentOrganization': {
          '@type': 'LocalBusiness',
          'name': 'M&M Junk Removal',
          'url': HUB_URL
        },
        'url': `${HUB_URL}/junk-removal-${cleanSlug}-wa/`,
        'telephone': HUB_PHONE,
        'priceRange': '$$',
        'image': `${HUB_URL}/assets/images/Federal%20Way%20WA%20Junk%20and%20Trash%20Removal.png`,
        'sameAs': [
          'https://www.google.com/maps?cid=15999711673070107161',
          'https://ccfs.sos.wa.gov/#/BusinessSearch/BusinessInformation',
          'https://dor.wa.gov/',
          'https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173',
          'https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3',
          'https://www.facebook.com/mmjunkremoval/',
          AMZY_BOOKING_URL
        ],
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': cityName,
          'addressRegion': 'WA',
          'postalCode': zipCodes[0] || '98003',
          'addressCountry': 'US'
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': meta?.coords[0] || 47.3223,
          'longitude': meta?.coords[1] || -122.3126
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': reputation.aggregateRating,
          'reviewCount': String(reputation.reviewCount),
          'bestRating': '5'
        },
        'areaServed': [
          {
            '@type': 'City',
            'name': cityName,
            '@id': wikidataUri,
            'sameAs': [
              wikidataUri,
              `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)},_Washington`
            ]
          },
          ...zipCodes.map(code => ({
            '@type': 'PostalCode',
            'postalCode': code
          })),
          ...neighborhoods.map(n => ({
            '@type': 'Place',
            'name': n
          }))
        ],
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': `${cityName} Junk Removal Services`,
          'itemListElement': [
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': `Residential Cleanouts in ${cityName}`,
                'description': `Basement, attic, garage, and estate cleanouts across ${cityName}.`
              },
              'priceSpecification': {
                '@type': 'PriceSpecification',
                'price': '125.00',
                'priceCurrency': 'USD'
              },
              'url': AMZY_BOOKING_URL
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': `Appliance & Mattress Disposal in ${cityName}`,
                'description': `EPA freon certified recycling for refrigerators, freezers, washers, and mattress haul-away.`
              },
              'priceSpecification': {
                '@type': 'PriceSpecification',
                'price': '95.00',
                'priceCurrency': 'USD'
              },
              'url': AMZY_BOOKING_URL
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': `Yard Debris & Storm Timber Clearing in ${cityName}`,
                'description': `Clearing Western Washington storm fall, fir needles, brush, and blackberries.`
              },
              'url': AMZY_BOOKING_URL
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': `Commercial & Property Turnover in ${cityName}`,
                'description': `Fast turnaround for property managers and commercial retail along ${corridors[0]}.`
              },
              'url': AMZY_BOOKING_URL
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': `Light Demolition in ${cityName}`,
                'description': `Safe tear-down and disposal of old hot tubs, backyard sheds, and damaged fencing.`
              },
              'url': AMZY_BOOKING_URL
            }
          ]
        },
        'potentialAction': [
          {
            '@type': 'ReserveAction',
            'name': `Book Junk Removal in ${cityName} via AMZY`,
            'target': {
              '@type': 'EntryPoint',
              'urlTemplate': AMZY_BOOKING_URL,
              'inLanguage': 'en-US',
              'actionPlatform': [
                'http://schema.org/DesktopWebPlatform',
                'http://schema.org/MobileWebPlatform'
              ]
            },
            'result': {
              '@type': 'Reservation',
              'name': `Online Service Booking for ${cityName}, WA`
            }
          },
          {
            '@type': 'ScheduleAction',
            'name': `Schedule Online Pickup in ${cityName}`,
            'target': {
              '@type': 'EntryPoint',
              'urlTemplate': AMZY_BOOKING_URL,
              'inLanguage': 'en-US'
            }
          }
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': `${HUB_URL}/junk-removal-${cleanSlug}-wa/#faq`,
        'mainEntity': faqItems.map(item => ({
          '@type': 'Question',
          'name': item.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.a
          }
        }))
      },
      ...jobs.map((job) => ({
        '@type': 'AchieveAction',
        '@id': job.slug ? `${HUB_URL}/jobs/${job.slug}/#action` : `${HUB_URL}/junk-removal-${cleanSlug}-wa/#job-${job.id}`,
        'name': `${job.serviceType} in ${cityName}`,
        'url': job.slug ? `${HUB_URL}/jobs/${job.slug}/` : undefined,
        'agent': { '@id': `${HUB_URL}/junk-removal-${cleanSlug}-wa/#business` },
        'location': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': cityName,
            'addressRegion': 'WA'
          }
        },
        'result': job.customerReview ? {
          '@type': 'Review',
          'reviewRating': { '@type': 'Rating', 'ratingValue': job.reviewRating || 5, 'bestRating': 5 },
          'reviewBody': job.customerReview,
          'author': { '@type': 'Person', 'name': job.reviewerName || 'Verified Client' }
        } : undefined
      })),
      ...socialPosts.filter(p => p.videoUrl || p.platform === 'youtube').map((post) => ({
        '@type': 'VideoObject',
        '@id': `${HUB_URL}/junk-removal-${cleanSlug}-wa/#video-${post.id}`,
        'name': `${cityName}, WA Junk Removal Action: ${post.caption.slice(0, 60)}`,
        'description': post.caption,
        'thumbnailUrl': post.mediaUrl,
        'uploadDate': post.publishedAt.toISOString(),
        'contentUrl': post.videoUrl || `https://www.youtube.com/watch?v=${post.externalId}`,
        'embedUrl': `https://www.youtube-nocookie.com/embed/${post.externalId}`
      }))
    ]
  };

  return (
    <article style={{ maxWidth: '1020px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo; 
        <Link href="/services" style={{ color: '#2563eb', textDecoration: 'none', marginLeft: '6px' }}>Services</Link> &rsaquo; 
        <span style={{ marginLeft: '6px', color: '#374151', fontWeight: 600 }}>{cityName}, WA</span>
      </nav>

      {/* Hero Section */}
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', marginBottom: '16px', lineHeight: 1.2 }}>
          Junk Removal & Hauling Services in {cityName}, WA
        </h1>
        <p style={{ fontSize: '18px', color: '#374151', marginBottom: '24px', lineHeight: 1.65 }}>
          Looking for dependable, affordable junk removal in {cityName}? M&M Junk Removal delivers full-service hauling throughout {cityName} and surrounding {county} neighborhoods. 
          Whether clearing out a cluttered garage in <strong>{neighborhoods[0]}</strong>, renovating a property near <strong>{corridors[3] || corridors[0]}</strong>, or removing yard storm debris in <strong>{neighborhoods[2] || neighborhoods[1]}</strong>, 
          our team handles all lifting, heavy loading, eco-sorting, and certified disposal with zero corporate franchise markups.
        </p>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href={AMZY_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#ea580c',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
            }}
          >
            Book Online via AMZY in 30 Sec ↗
          </a>
          <a
            href={`tel:${HUB_PHONE.replace(/[^0-9+]/g, '')}`}
            style={{
              border: '2px solid #d1d5db',
              color: '#111827',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '16px',
              backgroundColor: '#ffffff'
            }}
          >
            Call Dispatch: (253) 886-7724
          </a>
        </div>
      </header>

      {/* Section 1: Hyper-Local Geographic Anchor Content */}
      <section style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginTop: 0, marginBottom: '12px' }}>
          Hyper-Local Geographic Coverage in {cityName}
        </h2>
        <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '20px' }}>
          Unlike national franchises dispatching from remote call centers, M&M Junk Removal maintains an agile single-operator truck fleet staged directly along <strong>{corridors.join(', ')}</strong>. 
          This localized presence guarantees rapid arrival times and deep familiarity with {county} disposal compliance.
        </p>

        {/* Neighborhood Grid */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '10px' }}>
            Neighborhoods We Actively Serve in {cityName}:
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {neighborhoods.map((n) => (
              <span key={n} style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                📍 {n}
              </span>
            ))}
          </div>
        </div>

        {/* Transfer Station & Donation Channels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#ea580c', margin: '0 0 6px 0' }}>
              Responsible Disposal Routing
            </h4>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              All non-divertible waste is hauled directly to <strong>{transferStation}</strong>, meeting strict {county} environmental regulations.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#ea580c', margin: '0 0 6px 0' }}>
              Local Donation & Charity Triage
            </h4>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Working appliances, gently used furniture, and household items are triaged for donation to <strong>{donationPartners.join(' and ')}</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Core Local Service Matrix (H2 & H3s) */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>
          Core Hauling Services We Provide in {cityName}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '8px' }}>
              🏠 Home & Estate Cleanouts
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Complete decluttering for garages, attics, basements, and full estate liquidations across {cityName} homes. We do all the heavy lifting and sorting.
            </p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '8px' }}>
              ❄️ Appliance & Mattress Disposal
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Safe haul-away for old refrigerators, freezers, washers, dryers, and mattresses with certified EPA refrigerant freon reclamation.
            </p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '8px' }}>
              🌲 Yard Debris & Storm Waste
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Clearing Pacific Northwest fir needles, fallen storm timber, brush piles, and overgrown Himalayan blackberry root systems.
            </p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '8px' }}>
              🏢 Commercial & Tenant Cleanouts
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Rapid turnaround times for property managers, apartment turnovers, and retail strip centers along {corridors[0]}.
            </p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '8px' }}>
              🔨 Specialized Light Demolition
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Safe dismantling and removal of rotting backyard sheds, old hot tubs, cracked decks, and damaged fencing with magnetic nail sweeps.
            </p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '8px' }}>
              📦 Curbside Single-Item Pickups
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Have just one sofa, desk, or water heater ready at the curb? Take advantage of our express $95 MINI rate with same-day availability.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Transparent Volume-Based Pricing Guide */}
      <section style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '28px', marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#9a3412', marginTop: 0, marginBottom: '10px' }}>
          Transparent Volume-Based Pricing: Upfront Flat Rates
        </h2>
        <p style={{ fontSize: '15px', color: '#7c2d12', marginBottom: '20px' }}>
          No hidden franchise fees, fuel surcharges, or unexpected disposal extras. You only pay for the truck bed volume you use, backed by our 10% rate beat guarantee:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>MINI Curbside</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$95 – $140</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Single armchair, microwave, 2-3 bagged items.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>1 Pickup Truck Bed</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$140 – $230</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Mattress + box spring, 3-seat sofa, dining set.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>2 Pickup Loads</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$230 – $415</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Studio cleanout, sectional sofa, yard brush piles.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Full Dump Truck</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$740 – $1,110</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full garage overhaul, office clearing, remodel scrap.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Dump Truck Plus</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$1,110 – $1,480</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full estate liquidation, hoarder cleanup, large demo.</p>
          </div>
        </div>
      </section>

      {/* Section 4: Side-by-Side Comparison Grid */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Why {cityName} Chooses M&M Junk Removal Over National Franchises
        </h2>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '14px 18px', width: '25%' }}>Element / Factor</th>
                <th style={{ padding: '14px 18px', width: '37%', color: '#6b7280' }}>Franchise Competitors (1-800-Got-Junk / College HUNKS)</th>
                <th style={{ padding: '14px 18px', width: '38%', color: '#ea580c', fontWeight: 800 }}>M&M Junk Removal ({cityName})</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Dispatch Origin</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>Dispatched from regional hubs (Tacoma / Puyallup)</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Direct local presence rooted in South King County</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Local Community Context</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>High-level programmatic city name injection</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Granular coverage: {neighborhoods.slice(0, 4).join(', ')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Waste Regulations</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>Generic "we donate and recycle" phrasing</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Explicit {county} disposal compliance ({transferStation.split('&')[0]})</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Pricing Transparency</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>Estimates locked behind lead capture forms / national call centers</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Upfront volume-tier pricing and direct local phone access</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Cost Structure</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>20–30% corporate franchise royalty markup passed to client</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>100% independent owner-operator with 10% rate beat guarantee</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Local Micro-Case Snapshots */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Recent Field Operations & Case Snapshots in {cityName}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '18px', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#ea580c' }}>Verified Field Case</span>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '6px 0 8px 0' }}>{neighborhoods[0]} 2-Car Garage Cleanout</h4>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>Hauled 850 lbs of accumulated storage bins, workbench scraps, and broken lawn equipment in under 3 hours.</p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '18px', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#ea580c' }}>Verified Field Case</span>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '6px 0 8px 0' }}>{corridors[0]} Commercial Extraction</h4>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>Extracted 3 heavy commercial reach-in refrigerators via hydraulic liftgate for certified EPA freon reclamation.</p>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '18px', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#ea580c' }}>Verified Field Case</span>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '6px 0 8px 0' }}>{neighborhoods[2] || neighborhoods[1]} Storm Debris Clearing</h4>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>Cleared 1,200 lbs of wind-damaged fir tree branches and overgrown blackberries after heavy storm winds.</p>
          </div>
        </div>

        {/* Live Operational Telemetry Feed Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>Service Type</th>
                <th style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>Items Handled</th>
                <th style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>Rigging / Fleet</th>
                <th style={{ padding: '12px 16px' }}>Disposal Route</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                    Scheduled routes active in {cityName}. Operational scale receipts and telemetry logged upon dispatch completion.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb', fontWeight: 600 }}>
                      {job.slug ? (
                        <Link href={`/jobs/${job.slug}`} style={{ color: '#ea580c', textDecoration: 'none' }}>
                          {job.serviceType} ↗
                        </Link>
                      ) : (
                        job.serviceType
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                      {job.itemCategory} {job.weightLbs ? `(~${job.weightLbs.toLocaleString()} lbs)` : '(Standard Volume)'}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                      {job.equipmentUsed || '16ft Box Truck with Liftgate'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {job.disposalSite || 'Regional Certified Transfer Facility'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6: Verified Client Reviews */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Verified Client Reviews: {cityName}
        </h2>
        {jobs.filter((j) => j.customerReview).length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            {reputation.aggregateRating}-Star Google & Amzy Verified Hauling. Over {reputation.reviewCount} verified reviews across South King & Pierce Counties.
          </p>
        ) : (
          jobs
            .filter((j) => j.customerReview)
            .map((job) => (
              <blockquote
                key={job.id}
                style={{
                  borderLeft: '4px solid #ea580c',
                  padding: '16px 20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0 8px 8px 0',
                  margin: '0 0 16px 0'
                }}
              >
                <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>
                  "{job.customerReview}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  <cite style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', fontStyle: 'normal' }}>
                    — {job.reviewerName || 'Verified Client'} | {job.serviceType} in {cityName} ({job.reviewRating || 5}.0 ★ {job.reviewPlatform || 'Google'} Verified)
                  </cite>
                  {job.slug && (
                    <Link href={`/jobs/${job.slug}`} style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                      View Full Job Story & Telemetry ↗
                    </Link>
                  )}
                </div>
              </blockquote>
            ))
        )}
      </section>

      {/* Section 7: Social Signals & Video Demonstrations */}
      {socialPosts.length > 0 && (
        <section style={{ marginBottom: '44px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
            Field Demonstrations & Social Signals: {cityName}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {socialPosts.map((post) => (
              <div key={post.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                {post.platform === 'youtube' ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#000000' }}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${post.externalId}?rel=0&modestbranding=1`}
                      title={post.caption}
                      loading="lazy"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={`${post.caption} - M&M Junk Removal ${cityName}, WA`}
                    title={`${post.caption} - Verified Field Proof`}
                    width={480}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', aspectRatio: '4/3' }}
                  />
                )}
                <div style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#ea580c' }}>
                    {post.platform} • Verified Signal
                  </span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#374151' }}>
                    {post.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 8: Frequently Asked Questions (FAQ) */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Frequently Asked Questions: {cityName} Junk Removal
        </h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {faqItems.map((item, idx) => (
            <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
                {item.q}
              </h3>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <div style={{ textAlign: 'center', backgroundColor: '#111827', color: '#ffffff', borderRadius: '12px', padding: '36px 20px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
          Ready for Fast, Friendly Junk Removal in {cityName}?
        </h2>
        <p style={{ fontSize: '16px', color: '#9ca3af', maxWidth: '600px', margin: '0 auto 24px auto' }}>
          Upfront flat-rate pricing with zero hidden fees. Guaranteed 10% lower rates than national franchise quotes.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={AMZY_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#ea580c',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '15px'
            }}
          >
            Book via AMZY in 30 Seconds ↗
          </a>
          <a
            href={`tel:${HUB_PHONE.replace(/[^0-9+]/g, '')}`}
            style={{
              border: '1px solid #4b5563',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '15px'
            }}
          >
            Call (253) 886-7724
          </a>
        </div>
      </div>

      {/* Postal Zones & Footer Metadata */}
      <footer style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <strong>Authorized Postal Zones:</strong> {zipCodes.join(', ')} ({county}, Washington). 
        Staged and dispatched locally near {corridors[0]} and {corridors[1] || 'regional transfer hubs'}.
      </footer>
    </article>
  );
}
