import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES, getNearbyMunicipalitiesAsync, getNeighborhoodEntities } from '@/lib/geo-resolver';
import { getContractorContext, getEffectiveReputation } from '@/lib/business-context';

interface PageProps {
  params: { slug: string };
}

export const revalidate = false; // Relies on on-demand revalidateTag()
export const dynamicParams = true; // Allows newly ingested municipalities to generate on demand

function parseSpokeSlug(rawSlug: string): { cleanSlug: string; stateCode: string } | null {
  const match = rawSlug.match(/^junk-removal-(.+)-([a-z]{2})$/);
  if (!match) return null;
  return { cleanSlug: match[1], stateCode: match[2].toUpperCase() };
}

export async function generateStaticParams() {
  try {
    const spokes = await db.locationSpoke.findMany({ select: { slug: true, state: true } });
    if (spokes.length > 0) {
      return spokes.map(s => ({
        slug: `junk-removal-${s.slug}-${(s.state || 'wa').toLowerCase()}`
      }));
    }
  } catch {
    // Database offline during initial static generation
  }

  return Object.keys(AUTHORIZED_MUNICIPALITIES).map(slug => ({
    slug: `junk-removal-${slug}-wa`
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawSlug = params?.slug || '';
  const ctx = await getContractorContext();
  const parsed = parseSpokeSlug(rawSlug);
  if (!parsed) {
    return { title: ctx.brandName };
  }

  const { cleanSlug, stateCode } = parsed;
  const spoke = cleanSlug ? await db.locationSpoke.findUnique({ where: { slug: cleanSlug } }).catch(() => null) : null;
  const meta = !ctx.isConfiguredFromDb && !ctx.isColdStartEnv ? AUTHORIZED_MUNICIPALITIES[cleanSlug] : null;
  const cityName = spoke?.cityName || meta?.cityName || cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const region = spoke?.state || meta?.state || stateCode;

  if (cleanSlug === 'federal-way' && ctx.brandName === 'M&M Junk Removal') {
    return {
      title: 'Junk Removal Federal Way WA | Fast Local Hauling | M&M Junk Removal',
      description: 'Local junk removal in Federal Way, WA. Same-day appliance removal, cleanouts & yard waste hauling across Twin Lakes, Redondo & Campus. Free upfront quote!',
      alternates: {
        canonical: `${ctx.canonicalUrl}/junk-removal-federal-way-wa`
      }
    };
  }

  const neighborhoods = spoke?.neighborhoods?.length ? spoke.neighborhoods : meta?.neighborhoods;
  const neighborhoodSample = neighborhoods?.slice(0, 3).join(', ');
  const geoContext = neighborhoodSample ? ` across ${neighborhoodSample} & nearby areas` : '';
  const phoneCue = ctx.displayPhone ? ` Call ${ctx.displayPhone}.` : '';

  return {
    title: `Junk Removal ${cityName} ${region} | Fast Local Hauling | ${ctx.brandName}`,
    description: `Local junk removal in ${cityName}, ${region}. Same-day appliance removal, cleanouts & yard waste hauling${geoContext}. Upfront flat-rate quote!${phoneCue}`,
    alternates: {
      canonical: `${ctx.canonicalUrl}/${rawSlug}`
    }
  };
}

export default async function DynamicSpokePage({ params }: PageProps) {
  const rawSlug = params?.slug || '';
  const parsed = parseSpokeSlug(rawSlug);
  if (!parsed) {
    notFound();
  }

  const { cleanSlug, stateCode } = parsed;
  const [ctx, reputation, spoke] = await Promise.all([
    getContractorContext(),
    getEffectiveReputation(),
    db.locationSpoke.findUnique({
      where: { slug: cleanSlug },
      include: {
        jobs: {
          where: { isPublished: true },
          orderBy: { completedAt: 'desc' },
          take: 15
        },
        socialPosts: {
          orderBy: { publishedAt: 'asc' },
          take: 6
        }
      }
    }).catch(() => null),
  ]);

  const allowLegacyMeta = !ctx.isConfiguredFromDb && !ctx.isColdStartEnv;
  const meta = AUTHORIZED_MUNICIPALITIES[cleanSlug];
  if (!spoke && (!allowLegacyMeta || !meta)) {
    notFound();
  }

  // Resolve municipality metadata with dynamic DB first
  const cityName = spoke?.cityName || meta?.cityName || cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateAbbr = spoke?.state || meta?.state || stateCode || ctx.state;
  const county = spoke?.county || meta?.county || ctx.county || `${cityName} Area`;
  const zipCodes = (spoke?.zipCodes && spoke.zipCodes.length > 0) ? spoke.zipCodes : (meta?.zipCodes || (ctx.postalCode ? [ctx.postalCode] : []));
  const wikidataUri = spoke?.wikidataUri || meta?.wikidataUri || '';
  const spokeCoords: [number, number] =
    spoke?.coordinates && spoke.coordinates.length === 2
      ? (spoke.coordinates as [number, number])
      : meta?.coords || [ctx.lat, ctx.lng];
  const jobs = spoke?.jobs || [];
  const nearbyCities = await getNearbyMunicipalitiesAsync(cleanSlug, 4);
  const neighborhoodEntities = meta ? getNeighborhoodEntities(meta) : [];
  
  // Hyper-local geographic contextual datasets
  const neighborhoods = (spoke?.neighborhoods && spoke.neighborhoods.length > 0)
    ? spoke.neighborhoods
    : meta?.neighborhoods || [`${cityName} City Center`, `${cityName} Residential District`, `${cityName} Business Corridors`];
  const corridors = meta?.majorCorridors || [
    `${cityName} Main Arterials`, `${county} Transit Corridors`
  ];
  const transferStation = meta?.transferStation || `Regional Certified Transfer & Recycling Facility`;
  const donationPartners = meta?.donationPartners || [`${cityName} Local Charity Partners`];

  let socialPosts = spoke?.socialPosts || [];
  if (socialPosts.length === 0) {
    socialPosts = await db.socialPost.findMany({
      where: {
        OR: [
          { locationId: null },
          { location: { isPrimaryHub: true } }
        ]
      },
      orderBy: { publishedAt: 'desc' },
      take: 4
    }).catch(() => []);
  }

  if (!cityName) {
    notFound();
  }

  const HUB_PHONE = ctx.phone || '';
  const HUB_DISPLAY_PHONE = ctx.displayPhone || ctx.phone;
  const HUB_URL = ctx.canonicalUrl;
  const AMZY_BOOKING_URL = ctx.bookingUrl;

  const faqItems = [
    {
      q: `How does your pricing work for ${cityName} pickups?`,
      a: `We quote upfront flat rates based strictly on the volume of space your items occupy in our hauling truck. All labor, loading, and certified transfer station disposal fees are included with zero surprise surcharges.`
    },
    {
      q: `Where does our junk go after pickup in ${cityName}?`,
      a: `Usable furniture, household goods, and working appliances are sorted and diverted to local charities like ${donationPartners.join(' and ')}. Unusable materials are hauled directly to certified regional facilities (${transferStation}) in full compliance with ${county} regulations.`
    },
    {
      q: `How soon can you haul away my junk in ${cityName}?`,
      a: `We frequently offer same-day and next-day pickup windows across ${cityName}. ${HUB_DISPLAY_PHONE ? `Call dispatch directly at ${HUB_DISPLAY_PHONE} or lock in` : 'Lock in'} your appointment online through our live AMZY booking calendar.`
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
        '@id': `${HUB_URL}/${rawSlug}/#business`,
        'name': `${ctx.brandName} - ${cityName}`,
        'parentOrganization': {
          '@type': 'LocalBusiness',
          'name': ctx.brandName,
          'url': HUB_URL
        },
        'url': `${HUB_URL}/${rawSlug}/`,
        ...(HUB_PHONE ? { 'telephone': HUB_PHONE } : {}),
        'priceRange': '$$',
        ...(ctx.sameAsUrls.length > 0 ? { 'sameAs': ctx.sameAsUrls } : {}),
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': cityName,
          'addressRegion': stateAbbr,
          'postalCode': zipCodes[0] || ctx.postalCode || '',
          'addressCountry': ctx.country
        },
        ...(spokeCoords[0] || spokeCoords[1] ? {
          'geo': {
            '@type': 'GeoCoordinates',
            'latitude': spokeCoords[0],
            'longitude': spokeCoords[1]
          }
        } : {}),
        ...(reputation.reviewCount > 0 && reputation.aggregateRating ? {
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': reputation.aggregateRating,
            'reviewCount': String(reputation.reviewCount),
            'bestRating': '5'
          }
        } : {}),
        'areaServed': [
          {
            '@type': 'City',
            'name': cityName,
            ...(wikidataUri ? { '@id': wikidataUri, 'sameAs': [wikidataUri] } : {})
          },
          ...zipCodes.map(code => ({
            '@type': 'PostalCode',
            'postalCode': code
          })),
          ...neighborhoodEntities.map(ne => ({
            '@type': 'Place',
            'name': `${ne.name}, ${cityName}, ${stateAbbr}`,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': cityName,
              'addressRegion': stateAbbr,
              'postalCode': ne.postalCode,
              'addressCountry': ctx.country
            },
            ...(ne.coords ? {
              'geo': {
                '@type': 'GeoCoordinates',
                'latitude': ne.coords[0],
                'longitude': ne.coords[1]
              }
            } : {}),
            'containedInPlace': {
              '@type': 'City',
              'name': cityName,
              ...(wikidataUri ? { '@id': wikidataUri } : {})
            }
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
                'price': '220.00',
                'minPrice': '176.00',
                'maxPrice': '264.00',
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
        '@id': `${HUB_URL}/${rawSlug}/#faq`,
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
        '@id': job.slug ? `${HUB_URL}/jobs/${job.slug}/#action` : `${HUB_URL}/${rawSlug}/#job-${job.id}`,
        'name': `${job.serviceType} in ${cityName}`,
        'url': job.slug ? `${HUB_URL}/jobs/${job.slug}/` : undefined,
        'agent': { '@id': `${HUB_URL}/${rawSlug}/#business` },
        'location': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': cityName,
            'addressRegion': stateAbbr
          }
        },
        'result': job.customerReview ? {
          '@type': 'Review',
          'reviewRating': { '@type': 'Rating', 'ratingValue': job.reviewRating || 5, 'bestRating': 5 },
          'reviewBody': job.customerReview,
          'author': { '@type': 'Person', 'name': job.reviewerName || 'Verified Client' },
          'itemReviewed': {
            '@type': 'LocalBusiness',
            '@id': `${HUB_URL}/${rawSlug}/#business`,
            'name': ctx.brandName,
            ...(HUB_PHONE ? { 'telephone': HUB_PHONE } : {}),
            'priceRange': '$$',
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': ctx.street,
              'addressLocality': cityName,
              'addressRegion': stateAbbr,
              'postalCode': zipCodes[0] || ctx.postalCode || '',
              'addressCountry': ctx.country
            }
          }
        } : undefined
      })),
      ...socialPosts.filter(p => p.videoUrl || p.platform === 'youtube').map((post) => {
        const cleanVidId = post.videoUrl?.match(/(?:shorts\/|[?&]v=)([a-zA-Z0-9_-]+)/)?.[1] || post.externalId?.replace(/^yt-/, '') || '';
        return {
          '@type': 'VideoObject',
          '@id': `${HUB_URL}/${rawSlug}/#video-${post.id}`,
          'name': `${cityName}, ${stateAbbr} Junk Removal Action: ${post.caption.slice(0, 60)}`,
          'description': post.caption,
          'thumbnailUrl': post.mediaUrl || `https://img.youtube.com/vi/${cleanVidId}/maxresdefault.jpg`,
          'uploadDate': post.publishedAt.toISOString(),
          'contentUrl': post.videoUrl || `https://www.youtube.com/watch?v=${cleanVidId}`,
          'embedUrl': `https://www.youtube.com/embed/${cleanVidId}`
        };
      })
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
        <Link href="/locations" style={{ color: '#2563eb', textDecoration: 'none', marginLeft: '6px' }}>Locations</Link> &rsaquo; 
        <span style={{ marginLeft: '6px', color: '#374151', fontWeight: 600 }}>{cityName}, {stateAbbr}</span>
      </nav>

      {/* Hero Section */}
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', marginBottom: '16px', lineHeight: 1.2 }}>
          Junk Removal &amp; Hauling Services in {cityName}, {stateAbbr}
        </h1>
        <p style={{ fontSize: '18px', color: '#374151', marginBottom: '24px', lineHeight: 1.65 }}>
          Looking for dependable, affordable junk removal in {cityName}? {ctx.brandName} delivers full-service hauling throughout {cityName} and surrounding {county} neighborhoods. 
          Whether clearing out a cluttered garage in <strong>{neighborhoods[0]}</strong>, renovating a property near <strong>{corridors[3] || corridors[0]}</strong>, or removing yard debris in <strong>{neighborhoods[2] || neighborhoods[1]}</strong>, 
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
          {HUB_PHONE && (
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
              Call Dispatch: {HUB_DISPLAY_PHONE}
            </a>
          )}
        </div>
      </header>

      {/* Section 1: Hyper-Local Geographic Anchor Content */}
      <section style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginTop: 0, marginBottom: '12px' }}>
          Hyper-Local Geographic Coverage in {cityName}
        </h2>
        <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '20px' }}>
          Unlike national franchises dispatching from remote call centers, {ctx.brandName} stages trucks locally along <strong>{corridors.join(', ')}</strong> for rapid dispatch across {county}.
        </p>

        {/* Neighborhood Grid */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '10px' }}>
            Neighborhoods We Actively Serve in {cityName}:
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {neighborhoodEntities.map((ne) => (
              <span
                key={ne.name}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📍</span>
                <span>{ne.name}</span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    fontWeight: 600,
                    backgroundColor: '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {ne.postalCode}
                </span>
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
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$95 – $150</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Single armchair, microwave, 2-3 bagged items.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>1 Pickup Truck Bed</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$176 – $264</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Mattress + box spring, 3-seat sofa, dining set.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>2 Pickup Loads</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$352 – $528</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Studio cleanout, sectional sofa, yard brush piles.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Full Dump Truck</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$960 – $1,440</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full garage overhaul, office clearing, remodel scrap.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Dump Truck Plus</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$1,560 – $2,400+</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full estate liquidation, hoarder cleanup, large demo.</p>
          </div>
        </div>
      </section>

      {/* Section 4: Side-by-Side Comparison Grid */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Why {cityName} Chooses {ctx.brandName} Over National Franchises
        </h2>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '14px 18px', width: '25%' }}>Element / Factor</th>
                <th style={{ padding: '14px 18px', width: '37%', color: '#6b7280' }}>Franchise Competitors</th>
                <th style={{ padding: '14px 18px', width: '38%', color: '#ea580c', fontWeight: 800 }}>{ctx.brandName} ({cityName})</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Dispatch Origin</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>Outsourced regional call centers</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Direct local dispatch serving {ctx.city} &amp; {county}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Local Community Context</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>High-level programmatic city name injection</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Granular coverage: {neighborhoods.slice(0, 4).join(', ')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Waste Regulations</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>Generic &ldquo;we donate and recycle&rdquo; phrasing</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Explicit {county} disposal compliance ({transferStation.split('&')[0]})</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Pricing Transparency</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>Estimates locked behind national call centers</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>Upfront volume-tier pricing and direct local access</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 18px', fontWeight: 700 }}>Cost Structure</td>
                <td style={{ padding: '12px 18px', color: '#4b5563' }}>20–30% corporate franchise royalty markup passed to client</td>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: '#111827' }}>100% independent local operator</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Verified Field Operations (strictly DB-driven — zero fabricated cases on cold start) */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Recent Field Operations &amp; Telemetry in {cityName}
        </h2>
        {jobs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '18px', backgroundColor: '#ffffff' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#ea580c' }}>Verified Field Case</span>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '6px 0 8px 0' }}>{job.serviceType}</h4>
                <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 10px 0' }}>
                  {job.itemCategory}{job.weightLbs ? ` (${job.weightLbs.toLocaleString()} lbs)` : ''}{job.disposalSite ? ` routed via ${job.disposalSite}` : ''}.
                </p>
                {job.slug && (
                  <Link href={`/jobs/${job.slug}`} style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                    View Case Study &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

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

      {/* Featured Project Proof & Before/After in City */}
      {jobs.filter((j) => j.mediaUrls && j.mediaUrls.length > 0).length > 0 && (
        <section style={{ marginBottom: '44px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
              📸 Featured Project Proof &amp; Before/After in {cityName}
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #86efac' }}>
              ✓ Verified Job Photos
            </span>
          </div>

          {jobs
            .filter((j) => j.mediaUrls && j.mediaUrls.length > 0)
            .map((featuredJob) => (
              <div key={featuredJob.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '16px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      {featuredJob.serviceType}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      {featuredJob.itemCategory} • {featuredJob.disposalSite || 'Eco Transfer Facility'}
                    </div>
                  </div>
                  {featuredJob.slug && (
                    <Link
                      href={`/jobs/${featuredJob.slug}`}
                      style={{ backgroundColor: '#ea580c', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '13px' }}
                    >
                      View Full Case Study &rsaquo;
                    </Link>
                  )}
                </div>

                {/* Side-by-Side Before & After */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', padding: '20px' }}>
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid #ef4444', backgroundColor: '#ffffff' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={featuredJob.mediaUrls[0]}
                        alt={`Before: ${featuredJob.serviceType} in ${cityName}, WA`}
                        width={600}
                        height={400}
                        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                      <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#dc2626', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        🔴 Before Teardown
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Standing Structure Prior to Teardown
                    </div>
                  </div>

                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid #16a34a', backgroundColor: '#ffffff' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={featuredJob.mediaUrls[featuredJob.mediaUrls.length - 1]}
                        alt={`After: ${featuredJob.serviceType} in ${cityName}, WA`}
                        width={600}
                        height={400}
                        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                      <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#16a34a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        🟢 After: 100% Recycled &amp; Cleaned
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Clean Surface &amp; Magnetic Nail Sweep Complete
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </section>
      )}

      {/* Section 6: Verified Client Reviews */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Verified Client Reviews: {cityName}
        </h2>
        {jobs.filter((j) => j.customerReview).length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            {reputation.reviewCount > 0 && reputation.aggregateRating
              ? `${reputation.aggregateRating}-Star Google & Amzy Verified Hauling. ${reputation.reviewCount} verified reviews across ${county} and surrounding communities.`
              : `Collecting first verified customer reviews in ${cityName}, ${stateAbbr}.`}
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
            Field Demonstrations &amp; Social Signals: {cityName}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {socialPosts.map((post) => {
              const cleanVidId = post.videoUrl?.match(/(?:shorts\/|[?&]v=)([a-zA-Z0-9_-]+)/)?.[1] || post.externalId?.replace(/^yt-/, '') || '';
              return (
                <div key={post.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {post.platform === 'youtube' && cleanVidId ? (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#0f172a' }}>
                      <a
                        href={post.videoUrl || `https://youtube.com/shorts/${cleanVidId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Watch ${post.caption} on YouTube`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
                      >
                        <img
                          src={`https://i.ytimg.com/vi/${cleanVidId}/hqdefault.jpg`}
                          alt={`${post.caption} - Video Preview`}
                          width={480}
                          height={360}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '56px', height: '40px', backgroundColor: 'rgba(234, 88, 12, 0.95)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </a>
                    </div>
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={`${post.caption} - ${ctx.brandName} ${cityName}, ${stateAbbr}`}
                      title={`${post.caption} - Verified Field Proof`}
                      width={480}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', aspectRatio: '4/3' }}
                    />
                  )}
                  <div style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#ea580c' }}>
                      {post.platform} • Verified Signal
                    </span>
                    <p style={{ margin: '6px 0 10px 0', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                      {post.caption}
                    </p>
                    {post.platform === 'youtube' && cleanVidId && (
                      <a
                        href={post.videoUrl || `https://youtube.com/shorts/${cleanVidId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#ea580c',
                          color: '#ffffff',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          fontSize: '12px'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Watch on YouTube Shorts ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section: Regional Fleet Coverage & Internal Linking Mesh */}
      {nearbyCities.length > 0 && (
        <section style={{ marginBottom: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#ea580c', letterSpacing: '0.05em' }}>
              Regional Fleet Mesh
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 10px 0' }}>
            Also Serving Nearby Communities from {cityName}
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Our radio-dispatched hauling trucks operate continuously across {county} and surrounding borders. Need same-day junk pickup or property cleanouts in an adjacent community? We provide direct service to our nearest municipal hubs:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {nearbyCities.map((nearby) => (
              <Link
                key={nearby.slug}
                href={`/junk-removal-${nearby.slug}-${(nearby.state || stateAbbr).toLowerCase()}`}
                style={{
                  display: 'block',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                    ~{nearby.distanceMiles} miles away
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>↗</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
                  {nearby.cityName} Junk Removal
                </h3>
                <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: 1.4 }}>
                  {nearby.corridor ? `Rapid dispatch via ${nearby.corridor}.` : `Local hauling & property cleanouts in ${nearby.cityName}.`}
                </p>
              </Link>
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
          {HUB_PHONE && (
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
              Call {HUB_DISPLAY_PHONE}
            </a>
          )}
        </div>
      </div>

      {/* Postal Zones & Footer Metadata */}
      <footer style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <strong>Authorized Postal Zones:</strong> {zipCodes.join(', ') || ctx.postalCode || 'Local Service Area'} ({county}, {stateAbbr}). 
        Staged and dispatched locally near {corridors[0]} and {corridors[1] || 'regional transfer hubs'}.
      </footer>
    </article>
  );
}
