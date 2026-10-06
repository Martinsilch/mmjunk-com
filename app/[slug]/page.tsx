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

  return {
    title: `Junk Removal in ${cityName}, WA | M&M Junk Removal`,
    description: `Fast, friendly junk removal in ${cityName}, WA. Single-operator hauling, commercial appliance removal, estate cleanouts, and scrap recycling. Upfront $125 baseline rate.`,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'HomeAndConstructionBusiness', 'RecyclingCenter'],
        '@id': `${HUB_URL}/#business`,
        'name': 'M&M Junk Removal',
        'url': HUB_URL,
        'telephone': HUB_PHONE,
        'priceRange': '$$',
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
          'addressLocality': 'Federal Way',
          'addressRegion': 'WA',
          'postalCode': '98003',
          'addressCountry': 'US'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': reputation.aggregateRating,
          'reviewCount': String(reputation.reviewCount),
          'bestRating': '5'
        },
        'areaServed': {
          '@type': 'City',
          'name': cityName,
          '@id': wikidataUri,
          'sameAs': [
            wikidataUri,
            `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)},_Washington`
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
      ...jobs.map((job) => ({
        '@type': 'AchieveAction',
        '@id': job.slug ? `${HUB_URL}/jobs/${job.slug}/#action` : `${HUB_URL}/junk-removal-${cleanSlug}-wa/#job-${job.id}`,
        'name': `${job.serviceType} in ${cityName}`,
        'url': job.slug ? `${HUB_URL}/jobs/${job.slug}/` : undefined,
        'agent': { '@id': `${HUB_URL}/#business` },
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
    <article style={{ maxWidth: '980px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Semantic Chunk 1: Location & Entity Anchor */}
      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo; 
        <Link href="/services" style={{ color: '#2563eb', textDecoration: 'none', marginLeft: '6px' }}>Services</Link> &rsaquo; 
        <span style={{ marginLeft: '6px', color: '#374151', fontWeight: 600 }}>{cityName}, WA</span>
      </nav>

      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: 1.25 }}>
        Junk Removal & Hauling Services in {cityName}, WA
      </h1>

      <p style={{ fontSize: '18px', color: '#374151', marginBottom: '24px' }}>
        M&M Junk Removal provides commercial and residential hauling across <strong>{cityName}, WA</strong> (ZIPs: {zipCodes.join(', ')}) with a $125 baseline minimum ($95 MINI curbside pickup). 
        Equipped with 16-foot high-wall box trucks (rated up to 4.5 tons payload capacity) with hydraulic liftgate rigging, our single-operator dispatch 
        handles everything from heavy commercial appliance recycling and restaurant equipment extraction to complete estate cleanouts across {county} communities.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
        <a
          href={AMZY_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: '#ea580c',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          Book Online via AMZY ↗
        </a>
        <a
          href={`tel:${HUB_PHONE.replace(/[^0-9+]/g, '')}`}
          style={{
            border: '1px solid #d1d5db',
            color: '#1f2937',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          Call Dispatch: (253) 886-7724
        </a>
      </div>

      {/* Semantic Chunk 2: Telemetry Table (Dense Vector Anchor with Bidirectional Case Study Links) */}
      <section style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Recent Field Operations & Scrap Telemetry in {cityName}
          </h2>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Live Operations Feed • Updated via Amzy Telemetry
          </span>
        </div>

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

      {/* Semantic Chunk 3: Grounded Third-Party Proof & Testimonials */}
      <section style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
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

      {/* Semantic Chunk 4: Social Signals & Video Demonstration Embeds (Phase 4 Foundation) */}
      {socialPosts.length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
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

      {/* Semantic Chunk 5: Postal Zones */}
      <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <strong>Authorized Postal Zones:</strong> {zipCodes.join(', ')} ({county}, Washington)
      </footer>
    </article>
  );
}
