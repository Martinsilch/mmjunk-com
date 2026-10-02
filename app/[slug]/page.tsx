import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';

interface PageProps {
  params: { slug: string };
}

export const revalidate = false; // Relies on on-demand revalidateTag()

export async function generateStaticParams() {
  try {
    const spokes = await db.locationSpoke.findMany({ select: { slug: true } });
    if (spokes.length > 0) {
      return spokes.map(s => ({ slug: `junk-removal-${s.slug}-wa` }));
    }
  } catch {
    // Database offline during initial static generation: use verified local dictionary
  }

  return Object.keys(AUTHORIZED_MUNICIPALITIES).map(slug => ({
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
  const cityName = spoke?.cityName || meta?.cityName || cleanSlug;

  return {
    title: `Junk Removal in ${cityName}, WA | M&M Junk Removal`,
    description: `Fast, friendly junk removal in ${cityName}, WA. Single-operator hauling, appliance removal, estate cleanouts, and scrap recycling. Upfront $125 baseline rate.`,
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

  let spoke = cleanSlug ? await db.locationSpoke.findUnique({
    where: { slug: cleanSlug },
    include: {
      jobs: {
        orderBy: { completedAt: 'desc' },
        take: 10
      }
    }
  }).catch(() => null) : null;

  // Fallback to verified metadata if DB is offline during build
  const cityName = spoke?.cityName || meta?.cityName;
  const county = spoke?.county || meta?.county || 'King County';
  const zipCodes = spoke?.zipCodes || meta?.zipCodes || ['98003'];
  const wikidataUri = spoke?.wikidataUri || meta?.wikidataUri || 'https://www.wikidata.org/wiki/Q852586';
  const jobs = spoke?.jobs || [];

  if (!cityName) {
    notFound();
  }

  const HUB_PHONE = '+1-253-886-7724';
  const HUB_URL = 'https://www.mmjunk.com';
  const AMZY_BOOKING_URL = 'https://amzy.me/?utm_content=4';

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
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': 'Federal Way',
          'addressRegion': 'WA',
          'postalCode': '98003',
          'addressCountry': 'US'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '5.0',
          'reviewCount': '234',
          'bestRating': '5'
        },
        'areaServed': {
          '@type': 'City',
          'name': cityName,
          'sameAs': wikidataUri
        }
      },
      ...jobs.map((job) => ({
        '@type': 'AchieveAction',
        '@id': `${HUB_URL}/junk-removal-${cleanSlug}-wa/#job-${job.id}`,
        'name': `${job.serviceType} in ${cityName}`,
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
      }))
    ]
  };

  return (
    <article style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Semantic Chunk 1: Location & Entity Anchor */}
      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo; 
        <Link href="/services" style={{ color: '#2563eb', textDecoration: 'none', marginLeft: '6px' }}>Services</Link> &rsaquo; 
        <span style={{ marginLeft: '6px', color: '#374151' }}>{cityName}, WA</span>
      </nav>

      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
        Junk Removal & Hauling Services in {cityName}, WA
      </h1>

      <p style={{ fontSize: '18px', color: '#374151', marginBottom: '24px' }}>
        M&M Junk Removal operates full-service commercial, residential, and estate cleanouts across 
        <strong> {cityName}</strong> and surrounding <strong>{county}</strong> communities. 
        Equipped with 16-foot high-wall box trucks (rated up to 4.5 tons) with hydraulic liftgate rigging, our single-operator dispatch 
        handles everything from heavy commercial appliance recycling to complete property cleanouts with an upfront $125 baseline rate.
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

      {/* Semantic Chunk 2: Telemetry Table (Dense Vector Anchor) */}
      <section style={{ marginTop: '36px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
          Recent Field Operations & Scrap Telemetry in {cityName}
        </h2>
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
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb', fontWeight: 600 }}>{job.serviceType}</td>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                      {job.itemCategory} {job.weightLbs ? `(~${job.weightLbs.toLocaleString()} lbs)` : '(Standard Volume)'}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>{job.equipmentUsed}</td>
                    <td style={{ padding: '12px 16px' }}>{job.disposalSite}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Semantic Chunk 3: Grounded Third-Party Proof */}
      <section style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
          Verified Client Reviews: {cityName}
        </h2>
        {jobs.filter((j) => j.customerReview).length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            5.0-Star Google Verified Hauling. Over 234 verified reviews across South King & Pierce Counties.
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
                <cite style={{ display: 'block', marginTop: '8px', fontSize: '13px', fontWeight: 600, color: '#4b5563', fontStyle: 'normal' }}>
                  — {job.reviewerName} | {job.serviceType} in {cityName} (Verified 5.0 ★ Google Review)
                </cite>
              </blockquote>
            ))
        )}
      </section>

      {/* Semantic Chunk 4: Postal Zones */}
      <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <strong>Authorized Postal Zones:</strong> {zipCodes.join(', ')} ({county}, Washington)
      </footer>
    </article>
  );
}
