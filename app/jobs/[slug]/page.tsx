import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';
import { getReputationMetrics } from '@/lib/reputation';

interface JobPageProps {
  params: { slug: string };
}

export const revalidate = false; // Relies on on-demand revalidateTag(`job-${slug}`)

export async function generateStaticParams() {
  try {
    const jobs = await db.jobStory.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    });
    return jobs.map(j => ({ slug: j.slug as string }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const slug = params?.slug || '';
  if (!slug) return { title: 'M&M Junk Removal Job Story' };

  const job = await db.jobStory.findFirst({
    where: {
      OR: [
        { slug },
        { externalJobId: slug },
        { id: slug }
      ]
    },
    include: { location: true }
  }).catch(() => null);

  if (!job) {
    return { title: 'Completed Hauling Case Study | M&M Junk Removal' };
  }

  const cityName = job.location?.cityName || 'Federal Way';
  const weightText = job.weightLbs ? `${job.weightLbs.toLocaleString()} lbs` : 'Standard Volume';

  return {
    title: `${job.serviceType} in ${cityName}, WA | M&M Junk Removal`,
    description: `Operational telemetry & verified field log: ${job.serviceType} (${job.itemCategory}) in ${cityName}, WA. Scale weight: ${weightText}. Eco-diverted via ${job.disposalSite || 'Certified Transfer Station'}.`,
    alternates: {
      canonical: `https://www.mmjunk.com/jobs/${job.slug || slug}/`
    },
    openGraph: {
      title: `${job.serviceType} in ${cityName}, WA | M&M Junk Removal`,
      description: `Job telemetry log: ${job.itemCategory} hauled and recycled in ${cityName}, WA. Single-operator upfront flat rates.`,
      url: `https://www.mmjunk.com/jobs/${job.slug || slug}/`,
      siteName: 'M&M Junk Removal',
      type: 'article',
      images: job.mediaUrls.length > 0 ? [{ url: job.mediaUrls[0] }] : [{ url: 'https://www.mmjunk.com/assets/images/logo.png' }]
    }
  };
}

export default async function JobStoryPage({ params }: JobPageProps) {
  const slug = params?.slug || '';
  if (!slug) notFound();

  const job = await db.jobStory.findFirst({
    where: {
      OR: [
        { slug },
        { externalJobId: slug },
        { id: slug }
      ]
    },
    include: { location: true }
  }).catch(() => null);

  if (!job) notFound();

  const spoke = job.location;
  const cityName = spoke?.cityName || 'Federal Way';
  const county = spoke?.county || 'King County';
  const zipCodes = spoke?.zipCodes || ['98003'];
  const logId = job.disposalReceipt || job.externalJobId || `MMJ-${job.id.slice(-6).toUpperCase()}`;
  const weightText = job.weightLbs ? `${job.weightLbs.toLocaleString()} lbs` : 'Standard Volume Tier';

  const HUB_PHONE = '+1-253-886-7724';
  const HUB_PHONE_RAW = '2538867724';
  const HUB_URL = 'https://www.mmjunk.com';
  const AMZY_BOOKING_URL = 'https://amzy.me/?utm_content=4';
  const reputation = getReputationMetrics();

  const canonicalUrl = `${HUB_URL}/jobs/${job.slug || slug}/`;

  // Schema.org Graph
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'HomeAndConstructionBusiness', 'RecyclingCenter'],
        '@id': `${HUB_URL}/#business`,
        name: 'M&M Junk Removal',
        url: HUB_URL,
        telephone: HUB_PHONE,
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '320th St',
          addressLocality: 'Federal Way',
          addressRegion: 'WA',
          postalCode: '98003',
          addressCountry: 'US'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: reputation.aggregateRating,
          reviewCount: String(reputation.reviewCount),
          bestRating: '5'
        },
        potentialAction: [
          {
            '@type': 'ReserveAction',
            name: 'Book Online via AMZY',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: AMZY_BOOKING_URL,
              inLanguage: 'en-US',
              actionPlatform: [
                'http://schema.org/DesktopWebPlatform',
                'http://schema.org/MobileWebPlatform'
              ]
            },
            result: {
              '@type': 'Reservation',
              name: 'Online Junk Removal Dispatch'
            }
          },
          {
            '@type': 'ScheduleAction',
            name: 'Schedule Junk Removal Pickup',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: AMZY_BOOKING_URL,
              inLanguage: 'en-US'
            }
          }
        ]
      },
      {
        '@type': 'Service',
        '@id': `${HUB_URL}/services/#service`,
        name: job.serviceType,
        provider: { '@id': `${HUB_URL}/#business` }
      },
      {
        '@type': 'AchieveAction',
        '@id': `${canonicalUrl}#action`,
        name: `${job.serviceType} in ${cityName}, WA`,
        agent: { '@id': `${HUB_URL}/#business` },
        endTime: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
        location: {
          '@type': 'Place',
          name: `${cityName}, WA Operations`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: cityName,
            addressRegion: 'WA',
            postalCode: zipCodes[0] || '98001',
            addressCountry: 'US'
          },
          ...(spoke?.coordinates && spoke.coordinates.length === 2 ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: spoke.coordinates[0],
              longitude: spoke.coordinates[1]
            }
          } : {})
        },
        ...(job.customerReview ? {
          result: {
            '@type': 'Review',
            '@id': `${canonicalUrl}#review`,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: job.reviewRating || 5,
              bestRating: 5
            },
            reviewBody: job.customerReview,
            author: {
              '@type': 'Person',
              name: job.reviewerName || 'Verified Client'
            },
            publisher: {
              '@type': 'Organization',
              name: job.reviewPlatform || 'Amzy / Google Verified'
            },
            ...(job.ownerReply ? {
              comment: {
                '@type': 'Comment',
                text: job.ownerReply,
                author: {
                  '@type': 'Person',
                  name: 'Martin Silch (Owner)'
                }
              }
            } : {})
          }
        } : {})
      },
      ...job.mediaUrls.map((url, idx) => ({
        '@type': 'ImageObject',
        '@id': `${canonicalUrl}#image-${idx + 1}`,
        url: url,
        contentUrl: url,
        caption: `${job.serviceType} in ${cityName}, WA - Operational Field Proof Photo #${idx + 1}`,
        description: `Field photo documenting ${job.itemCategory || 'junk removal haul'} performed by M&M Junk Removal in ${cityName}, WA. Scale weight: ${weightText}.`,
        author: { '@id': `${HUB_URL}/#business` }
      }))
    ]
  };

  const formattedDate = new Date(job.completedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Banner Ribbon */}
      <div style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '8px 16px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
              Log ID: {logId}
            </span>
            <span>Verified Operational Telemetry • {cityName}, WA</span>
          </div>
          <a href={`tel:${HUB_PHONE_RAW}`} style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>
            📞 (253) 886-7724
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '16px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#ea580c', letterSpacing: '-0.5px' }}>
              M&M JUNK REMOVAL
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={`tel:${HUB_PHONE_RAW}`}
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#1e293b', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}
            >
              (253) 886-7724
            </a>
            <a
              href={AMZY_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '8px 18px', backgroundColor: '#ea580c', color: '#ffffff', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}
            >
              Book Online ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', lineHeight: 1.6 }}>
        {/* Breadcrumb Navigation */}
        <nav style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>&rsaquo;</span>
          <Link href="/jobs/" style={{ color: '#2563eb', textDecoration: 'none' }}>Completed Jobs</Link>
          <span style={{ margin: '0 8px' }}>&rsaquo;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>{cityName} {job.serviceType}</span>
        </nav>

        {/* Metadata Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
            ✓ Verified Action
          </span>
          <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
            ⚡ Telemetry Verified
          </span>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600 }}>
            {formattedDate}
          </span>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600 }}>
            {cityName}, WA ({zipCodes.join(', ')})
          </span>
        </div>

        {/* Case Study Title */}
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1.25 }}>
          {job.serviceType}: {cityName}, WA
        </h1>

        {/* Executive Summary */}
        <p style={{ fontSize: '18px', color: '#334155', marginBottom: '32px', lineHeight: 1.6 }}>
          Operational field summary: On {formattedDate}, M&M Junk Removal completed the rapid extraction, transport, and certified disposal of <strong>{job.itemCategory}</strong> in <strong>{cityName}, WA</strong>. 
          Carried out via single-operator dispatch utilizing our {job.equipmentUsed || '16-foot high-wall box truck with hydraulic liftgate'}, materials were diverted for eco-sorting and compliant transfer at {job.disposalSite || 'the local transfer facility'}.
        </p>

        {/* Operational Telemetry Box */}
        <section style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '36px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️</span> Operational Telemetry & Field Specs
            </h2>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '3px 8px', borderRadius: '4px', color: '#334155' }}>
              TICKET: {logId}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', width: '220px', backgroundColor: '#fafbfc' }}>Service Category</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600, color: '#ea580c' }}>{job.serviceType}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', backgroundColor: '#fafbfc' }}>Municipality / Spoke</td>
                  <td style={{ padding: '12px 20px' }}>
                    <Link href={`/junk-removal-${spoke?.slug || cityName.toLowerCase()}-wa`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                      {cityName}, WA ({county}) ↗
                    </Link>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', backgroundColor: '#fafbfc' }}>Items Handled</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{job.itemCategory}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', backgroundColor: '#fafbfc' }}>Payload Scale Weight</td>
                  <td style={{ padding: '12px 20px' }}>
                    {job.weightLbs ? (
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {job.weightLbs.toLocaleString()} lbs ({(job.weightLbs / 2000).toFixed(2)} tons)
                      </span>
                    ) : (
                      'Standard Volume Tier'
                    )}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', backgroundColor: '#fafbfc' }}>Fleet & Rigging</td>
                  <td style={{ padding: '12px 20px' }}>{job.equipmentUsed || '16-foot High-Wall Box Truck, Hydraulic Liftgate'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', backgroundColor: '#fafbfc' }}>Disposal & Eco Facility</td>
                  <td style={{ padding: '12px 20px' }}>{job.disposalSite || 'Regional Certified Transfer Facility'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: '#64748b', backgroundColor: '#fafbfc' }}>Verification Reference</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#475569' }}>{job.disposalReceipt || 'Recorded in Amzy Dispatch'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Operational Proof Photos Gallery */}
        {job.mediaUrls && job.mediaUrls.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              📸 Operational Field Evidence & Proof
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {job.mediaUrls.map((url, idx) => (
                <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <img
                    src={url}
                    alt={`${job.serviceType} (${job.itemCategory || 'Hauling'}) operational proof photo #${idx + 1} in ${cityName}, WA - M&M Junk Removal`}
                    title={`${job.serviceType} in ${cityName}, WA - Verified Operational Evidence #${idx + 1}`}
                    width={600}
                    height={450}
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block', aspectRatio: '4/3' }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>
                    Proof Photo #{idx + 1} • {job.reviewPlatform || 'Operational'} Verification
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Customer Testimonial / Social Proof */}
        {job.customerReview && (
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Verified First-Party Client Testimonial
            </h2>
            <blockquote style={{ borderLeft: '4px solid #ea580c', backgroundColor: '#f8fafc', padding: '20px 24px', borderRadius: '0 8px 8px 0', margin: 0 }}>
              <p style={{ margin: '0 0 12px 0', fontStyle: 'italic', fontSize: '16px', color: '#334155' }}>
                "{job.customerReview}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  — {job.reviewerName || 'Verified Client'} • {job.reviewRating || 5}.0 ★★★★★ Verified
                </span>
                {job.reviewUrl && (
                  <a href={job.reviewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                    Verify on {job.reviewPlatform || 'Google'} ↗
                  </a>
                )}
              </div>

              {/* Owner Response Badge */}
              {job.ownerReply && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      💬 Response from Owner (Martin)
                    </span>
                    <span style={{ fontSize: '11px', backgroundColor: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                      Official
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6, fontStyle: 'normal' }}>
                    {job.ownerReply}
                  </p>
                </div>
              )}
            </blockquote>
          </section>
        )}

        {/* Bidirectional Internal Links */}
        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginBottom: '36px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
            Related Service Routes & Spoke Hubs
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: 1.8 }}>
            <li>
              Local Hub: <Link href={`/junk-removal-${spoke?.slug || cityName.toLowerCase()}-wa`} style={{ color: '#2563eb', fontWeight: 600 }}>Junk Removal Services in {cityName}, WA</Link> (ZIPs: {zipCodes.join(', ')})
            </li>
            <li>
              Browse Live Operations: <Link href="/jobs/" style={{ color: '#2563eb', fontWeight: 600 }}>Complete Field Execution Feed</Link>
            </li>
            <li>
              Machine Manifest: <a href="/llms.txt" style={{ color: '#2563eb', fontWeight: 600 }}>Operational LLMs Context & Manifest</a>
            </li>
          </ul>
        </section>

        {/* CTA Banner */}
        <div style={{ backgroundColor: '#ea580c', color: '#ffffff', borderRadius: '12px', padding: '36px 28px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px 0' }}>
            Need {job.serviceType} in {cityName}, WA?
          </h2>
          <p style={{ fontSize: '16px', margin: '0 auto 24px auto', maxWidth: '600px', opacity: 0.95 }}>
            Single-operator dispatch, guaranteed 10% rate beat on competitor written quotes, and prompt same-day scheduling across King & Pierce Counties.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <a
              href={AMZY_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: '#ffffff', color: '#ea580c', padding: '12px 28px', borderRadius: '6px', fontWeight: 800, textDecoration: 'none', fontSize: '15px' }}
            >
              Book Dispatch via AMZY ↗
            </a>
            <a
              href={`tel:${HUB_PHONE_RAW}`}
              style={{ backgroundColor: 'transparent', color: '#ffffff', border: '2px solid #ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 800, textDecoration: 'none', fontSize: '15px' }}
            >
              Call Dispatch: (253) 886-7724
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '24px 20px', marginTop: '48px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px 0' }}>
          &copy; 2026 M&M Junk Removal LLC • Operating across 25 Municipalities in South King & Pierce Counties.
        </p>
        <p style={{ margin: 0 }}>
          Authorized Postal Zones for this dispatch: {zipCodes.join(', ')} ({county}, WA).
        </p>
      </footer>
    </>
  );
}
