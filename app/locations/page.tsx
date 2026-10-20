import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';
import { getReputationMetrics } from '@/lib/reputation';

export const revalidate = false; // Relies on on-demand revalidateTag()

export const metadata: Metadata = {
  title: 'Service Locations | M&M Junk Removal - South King & Pierce County',
  description: 'M&M Junk Removal serves 25 municipalities across South King and Pierce County. Fast local hauling in Federal Way, Auburn, Kent, Tacoma, Puyallup & surrounding areas. Upfront quotes!',
  alternates: {
    canonical: 'https://www.mmjunk.com/locations/'
  }
};

export default async function LocationsHubPage() {
  const HUB_PHONE = '+1-253-886-7724';
  const HUB_URL = 'https://www.mmjunk.com';
  const AMZY_BOOKING_URL = 'https://amzy.me/?utm_content=4';
  const reputation = getReputationMetrics();

  // Fetch recent field operations from Neon PostgreSQL
  const recentJobs = await db.jobStory.findMany({
    orderBy: { completedAt: 'desc' },
    take: 8
  }).catch(() => []);

  // Split municipalities by county
  const kingCountyEntries = Object.entries(AUTHORIZED_MUNICIPALITIES).filter(
    ([_, meta]) => meta.county === 'King County'
  );
  const pierceCountyEntries = Object.entries(AUTHORIZED_MUNICIPALITIES).filter(
    ([_, meta]) => meta.county === 'Pierce County'
  );

  const faqItems = [
    {
      q: 'Which counties and cities does M&M Junk Removal actively serve?',
      a: 'We provide comprehensive junk removal across 25 municipalities in South King County and Pierce County, including Federal Way, Auburn, Kent, Renton, Des Moines, SeaTac, Tacoma, Puyallup, Lakewood, University Place, Edgewood, Gig Harbor, and Bonney Lake.'
    },
    {
      q: 'Do you charge extra travel fees between King County and Pierce County?',
      a: 'No. Our pricing is strictly based on the volume of space your items occupy in our high-wall hauling truck. We do not charge travel surcharge penalties or franchise fees between South King County and Pierce County service zones.'
    },
    {
      q: 'Where do our hauled items go after pickup?',
      a: 'Usable furniture, functional appliances, and household items are diverted to local charity partners such as St. Vincent de Paul and Goodwill. Non-divertible materials are routed to certified regional facilities including the King County Algona & Bow Lake transfer stations and Pierce County Hidden Valley & Mullen Street facilities.'
    },
    {
      q: 'Can I get same-day junk removal in any of your 25 service cities?',
      a: 'Yes! We stage our fleet across key transportation corridors (I-5, SR-167, SR-18, and SR-512) for rapid dispatch. Same-day appointments can be booked directly through our 30-second AMZY online calendar or by calling dispatch at (253) 886-7724.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'HomeAndConstructionBusiness', 'RecyclingCenter'],
        '@id': `${HUB_URL}/locations/#business`,
        'name': 'M&M Junk Removal - South Sound Territory Hub',
        'url': `${HUB_URL}/locations/`,
        'telephone': HUB_PHONE,
        'priceRange': '$$',
        'image': `${HUB_URL}/assets/images/Federal%20Way%20WA%20Junk%20and%20Trash%20Removal.png`,
        'sameAs': [
          'https://www.google.com/maps?cid=15999711673070107161',
          'https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173',
          'https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3',
          'https://www.facebook.com/mmjunkremoval/',
          AMZY_BOOKING_URL
        ],
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': reputation.aggregateRating,
          'reviewCount': String(reputation.reviewCount),
          'bestRating': '5'
        },
        'areaServed': Object.entries(AUTHORIZED_MUNICIPALITIES).map(([_, meta]) => ({
          '@type': 'City',
          'name': meta.cityName,
          '@id': meta.wikidataUri,
          'sameAs': [
            meta.wikidataUri,
            `https://en.wikipedia.org/wiki/${encodeURIComponent(meta.cityName)},_Washington`
          ]
        })),
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'South Sound Junk Removal Services',
          'itemListElement': [
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'Residential Cleanouts & Estate Liquidations',
                'description': 'Full-service garage, attic, basement, and whole-home cleanouts across South King and Pierce Counties.'
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
                'name': 'Appliance & Freon Disposal',
                'description': 'Certified EPA freon refrigerant recovery for refrigerators, freezers, and air conditioners.'
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
                'name': 'Commercial & Tenant Turnover Cleanouts',
                'description': 'Rapid property turnaround for property managers, retail spaces, and warehouse facilities.'
              },
              'url': AMZY_BOOKING_URL
            }
          ]
        },
        'potentialAction': [
          {
            '@type': 'ReserveAction',
            'name': 'Book Junk Removal via AMZY',
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
              'name': 'Online Service Booking'
            }
          },
          {
            '@type': 'ScheduleAction',
            'name': 'Schedule Online Pickup',
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
        '@id': `${HUB_URL}/locations/#faq`,
        'mainEntity': faqItems.map(item => ({
          '@type': 'Question',
          'name': item.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.a
          }
        }))
      }
    ]
  };

  return (
    <article style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo; 
        <span style={{ marginLeft: '6px', color: '#374151', fontWeight: 600 }}>Locations</span>
      </nav>

      {/* Hero Header */}
      <header style={{ marginBottom: '36px' }}>
        <div style={{ display: 'inline-block', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', borderRadius: '20px', padding: '4px 14px', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
          📍 25 Authorized Service Areas Across South Sound
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#111827', marginBottom: '16px', lineHeight: 1.2 }}>
          Junk Removal & Hauling Service Locations
        </h1>
        <p style={{ fontSize: '18px', color: '#374151', marginBottom: '24px', lineHeight: 1.65 }}>
          M&M Junk Removal operates daily throughout South King County and Pierce County. As a dedicated local owner-operator company founded by Martin Silch, 
          we eliminate the 20–30% corporate franchise markup, guarantee 10% lower rates than national franchises, and provide transparent volume pricing 
          with full transfer station and donation sorting compliance.
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

      {/* Section 1: South King County Municipalities */}
      <section style={{ marginBottom: '44px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>
            🌲 South King County Service Zones ({kingCountyEntries.length} Cities)
          </h2>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Dispatched via I-5, SR-167 & SR-18</span>
        </div>
        <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '20px' }}>
          All King County routes are processed in strict accordance with King County Solid Waste regulations, with non-divertible waste routed directly to the 
          <strong> Algona Transfer Station</strong> or <strong>Bow Lake Recycling Facility</strong>, and usable items triaged to local charities.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {kingCountyEntries.map(([slug, meta]) => (
            <div key={slug} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>
                    {meta.cityName}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', backgroundColor: '#fff7ed', padding: '3px 8px', borderRadius: '12px' }}>
                    King County
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                  <strong>Zip Codes:</strong> {meta.zipCodes.slice(0, 4).join(', ')}{meta.zipCodes.length > 4 ? '…' : ''}
                </div>

                {meta.neighborhoods && meta.neighborhoods.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Neighborhoods:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {meta.neighborhoods.slice(0, 4).map(n => (
                        <span key={n} style={{ fontSize: '11px', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '6px' }}>
                  <strong>Corridors:</strong> {meta.majorCorridors?.slice(0, 2).join(', ') || 'Regional arterials'}
                </div>
                <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '14px' }}>
                  <strong>Disposal:</strong> {meta.transferStation?.split('&')[0]?.trim() || 'King County Facility'}
                </div>
              </div>

              <Link
                href={`/junk-removal-${slug}-wa`}
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#111827',
                  textDecoration: 'none'
                }}
              >
                View {meta.cityName} Spoke & Telemetry →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Pierce County Municipalities */}
      <section style={{ marginBottom: '44px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>
            🌊 Pierce County Service Zones ({pierceCountyEntries.length} Cities)
          </h2>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Dispatched via I-5, SR-16 & SR-512</span>
        </div>
        <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '20px' }}>
          Our Pierce County routes coordinate directly with <strong>Pierce County Hidden Valley Transfer Station</strong>, 
          <strong>Prairie Ridge</strong>, and the <strong>City of Tacoma Recovery & Transfer Center</strong> on S Mullen St for eco-sorting and certified disposal.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {pierceCountyEntries.map(([slug, meta]) => (
            <div key={slug} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>
                    {meta.cityName}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '12px' }}>
                    Pierce County
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                  <strong>Zip Codes:</strong> {meta.zipCodes.slice(0, 4).join(', ')}{meta.zipCodes.length > 4 ? '…' : ''}
                </div>

                {meta.neighborhoods && meta.neighborhoods.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Neighborhoods:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {meta.neighborhoods.slice(0, 4).map(n => (
                        <span key={n} style={{ fontSize: '11px', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '6px' }}>
                  <strong>Corridors:</strong> {meta.majorCorridors?.slice(0, 2).join(', ') || 'Regional arterials'}
                </div>
                <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '14px' }}>
                  <strong>Disposal:</strong> {meta.transferStation?.split('&')[0]?.trim() || 'Pierce County Facility'}
                </div>
              </div>

              <Link
                href={`/junk-removal-${slug}-wa`}
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#111827',
                  textDecoration: 'none'
                }}
              >
                View {meta.cityName} Spoke & Telemetry →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Transparent Volume Pricing Table */}
      <section style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '28px', marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#9a3412', marginTop: 0, marginBottom: '10px' }}>
          Transparent Volume-Based Pricing: Available Across All 25 Municipalities
        </h2>
        <p style={{ fontSize: '15px', color: '#7c2d12', marginBottom: '20px' }}>
          No county line surcharges, hidden dump fees, or unexpected fuel extras. You only pay for the truck bed volume you occupy:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>MINI Curbside</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$95 – $140</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Single armchair, microwave, 2-3 bags.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>1 Pickup Truck Bed</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$140 – $230</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Mattress + box spring, 3-seat sofa, table set.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>2 Pickup Loads</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$230 – $415</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Studio cleanout, sectional couch, yard brush.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Full Dump Truck</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$740 – $1,110</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full 2-car garage overhaul, office cleanout.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Dump Truck Plus</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$1,110 – $1,480</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full estate liquidation, hoarder cleanout, demo.</p>
          </div>
        </div>
      </section>

      {/* Section 4: Live Neon Telemetry Feed */}
      {recentJobs.length > 0 && (
        <section style={{ marginBottom: '44px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
            Recent Field Telemetry Across Our Service Areas
          </h2>
          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>Service Type</th>
                  <th style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>Items Handled</th>
                  <th style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>Fleet Equipment</th>
                  <th style={{ padding: '12px 16px' }}>Disposal Routing</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
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
                      {job.itemCategory} {job.weightLbs ? `(~${job.weightLbs.toLocaleString()} lbs)` : ''}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                      {job.equipmentUsed || '16ft Box Truck with Liftgate'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {job.disposalSite || 'Certified Regional Facility'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section 5: Territory FAQs */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Frequently Asked Questions About Our Service Locations
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
          Ready to Schedule Junk Removal in Your Neighborhood?
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

      {/* Footer */}
      <footer style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <strong>M&M Junk Removal Territory Directory:</strong> Covering 25 municipalities across King and Pierce Counties, Washington. 
        Headquartered in Federal Way, WA with agile mobile staging units dispatched daily.
      </footer>
    </article>
  );
}
