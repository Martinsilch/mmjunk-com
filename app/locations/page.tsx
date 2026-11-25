import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';
import { getContractorContext, getEffectiveReputation } from '@/lib/business-context';

export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getContractorContext();
  return {
    title: `Service Locations | ${ctx.brandName} — ${ctx.city}, ${ctx.state}`,
    description: `${ctx.brandName} serves ${ctx.city}, ${ctx.state} and surrounding communities with upfront volume-based junk removal.`,
    alternates: {
      canonical: `${ctx.canonicalUrl}/locations`
    }
  };
}

export default async function LocationsHubPage() {
  const [ctx, reputation, dbSpokes, recentJobs] = await Promise.all([
    getContractorContext(),
    getEffectiveReputation(),
    db.locationSpoke.findMany({ orderBy: [{ isPrimaryHub: 'desc' }, { distanceMiles: 'asc' }, { cityName: 'asc' }] }).catch(() => []),
    db.jobStory.findMany({ where: { isPublished: true }, orderBy: { completedAt: 'desc' }, take: 8 }).catch(() => []),
  ]);

  const HUB_PHONE = ctx.phone || '';
  const HUB_DISPLAY_PHONE = ctx.displayPhone || ctx.phone;
  const HUB_URL = ctx.canonicalUrl;
  const AMZY_BOOKING_URL = ctx.bookingUrl;

  interface LocationEntry {
    slug: string;
    cityName: string;
    state: string;
    county: string;
    zipCodes: string[];
    neighborhoods: string[];
    majorCorridors?: string[];
    transferStation?: string;
    wikidataUri?: string;
  }

  const allowLegacyFallback = !ctx.isConfiguredFromDb && !ctx.isColdStartEnv;
  const allEntries: LocationEntry[] =
    dbSpokes.length > 0
      ? dbSpokes.map(s => {
          const meta = allowLegacyFallback ? AUTHORIZED_MUNICIPALITIES[s.slug] : undefined;
          return {
            slug: s.slug,
            cityName: s.cityName,
            state: s.state || ctx.state,
            county: s.county,
            zipCodes: s.zipCodes || [],
            neighborhoods: s.neighborhoods?.length ? s.neighborhoods : (meta?.neighborhoods || []),
            majorCorridors: meta?.majorCorridors,
            transferStation: meta?.transferStation,
            wikidataUri: s.wikidataUri || meta?.wikidataUri,
          };
        })
      : allowLegacyFallback
      ? Object.entries(AUTHORIZED_MUNICIPALITIES).map(([slug, meta]) => ({
          slug,
          cityName: meta.cityName,
          state: meta.state || 'WA',
          county: meta.county,
          zipCodes: meta.zipCodes,
          neighborhoods: meta.neighborhoods || [],
          majorCorridors: meta.majorCorridors,
          transferStation: meta.transferStation,
          wikidataUri: meta.wikidataUri,
        }))
      : [
          {
            slug: ctx.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            cityName: ctx.city,
            state: ctx.state,
            county: ctx.county,
            zipCodes: ctx.postalCode ? [ctx.postalCode] : [],
            neighborhoods: [],
          },
        ];

  // Group entries dynamically by county
  const groupedByCounty = Array.from(
    allEntries.reduce((map, entry) => {
      const list = map.get(entry.county) || [];
      list.push(entry);
      map.set(entry.county, list);
      return map;
    }, new Map<string, LocationEntry[]>())
  );

  const citySummaryList = allEntries.slice(0, 6).map(e => e.cityName).join(', ');

  const faqItems = [
    {
      q: `Which counties and cities does ${ctx.brandName} actively serve?`,
      a: `We provide comprehensive junk removal across ${allEntries.length} municipal service zone${allEntries.length === 1 ? '' : 's'} around ${ctx.city}, ${ctx.state}${citySummaryList ? `, including ${citySummaryList}` : ''}.`
    },
    {
      q: `Do you charge extra travel fees across local service zones?`,
      a: `No. Our pricing is strictly based on truck volume and item class with no surprise travel surcharge penalties across our core service zones.`
    },
    {
      q: `Where do hauled items go after pickup?`,
      a: `Usable furniture, functional appliances, and household items are sorted for local charity donation when possible, and remaining materials are routed to certified regional transfer and recycling facilities.`
    },
    {
      q: `Can I schedule same-day junk removal across your service cities?`,
      a: `Same-day and next-day appointments can be scheduled online through our live AMZY booking calendar${HUB_DISPLAY_PHONE ? ` or by calling dispatch at ${HUB_DISPLAY_PHONE}` : ''}.`
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'HomeAndConstructionBusiness', 'RecyclingCenter'],
        '@id': `${HUB_URL}/locations/#business`,
        'name': `${ctx.brandName} - Service Territory Directory`,
        'url': `${HUB_URL}/locations/`,
        ...(HUB_PHONE ? { 'telephone': HUB_PHONE } : {}),
        'priceRange': '$$',
        ...(ctx.sameAsUrls.length > 0 ? { 'sameAs': ctx.sameAsUrls } : {}),
        ...(reputation.reviewCount > 0 && reputation.aggregateRating ? {
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': reputation.aggregateRating,
            'reviewCount': String(reputation.reviewCount),
            'bestRating': '5'
          }
        } : {}),
        'areaServed': allEntries.map(entry => ({
          '@type': 'City',
          'name': entry.cityName,
          ...(entry.wikidataUri ? { '@id': entry.wikidataUri, 'sameAs': [entry.wikidataUri] } : {})
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
          &#128205; {allEntries.length} Authorized Service Area{allEntries.length === 1 ? '' : 's'} Centered on {ctx.city}, {ctx.state}
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#111827', marginBottom: '16px', lineHeight: 1.2 }}>
          Junk Removal &amp; Hauling Service Locations
        </h1>
        <p style={{ fontSize: '18px', color: '#374151', marginBottom: '24px', lineHeight: 1.65 }}>
          {ctx.brandName} operates daily throughout {ctx.city}, {ctx.state} and surrounding {groupedByCounty.map(([c]) => c).join(' and ')} communities with upfront volume-based pricing and certified transfer station routing.
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

      {/* Dynamic County Sections */}
      {groupedByCounty.map(([countyName, entries]) => (
        <section key={countyName} style={{ marginBottom: '44px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>
              {countyName} Service Zones ({entries.length} {entries.length === 1 ? 'City' : 'Cities'})
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {entries.map((entry) => (
              <div key={entry.slug} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>
                      {entry.cityName}
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', backgroundColor: '#fff7ed', padding: '3px 8px', borderRadius: '12px' }}>
                      {entry.county}
                    </span>
                  </div>

                  {entry.zipCodes.length > 0 && (
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                      <strong>Zip Codes:</strong> {entry.zipCodes.slice(0, 4).join(', ')}{entry.zipCodes.length > 4 ? '…' : ''}
                    </div>
                  )}

                  {entry.neighborhoods.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Neighborhoods:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {entry.neighborhoods.slice(0, 4).map(n => (
                          <span key={n} style={{ fontSize: '11px', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px' }}>
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.majorCorridors && (
                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '6px' }}>
                      <strong>Corridors:</strong> {entry.majorCorridors.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>

                <Link
                  href={`/junk-removal-${entry.slug}-${entry.state.toLowerCase()}`}
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
                    textDecoration: 'none',
                    marginTop: '10px'
                  }}
                >
                  View {entry.cityName} Spoke &amp; Telemetry →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Section 3: Transparent Volume Pricing Table */}
      <section style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '28px', marginBottom: '44px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#9a3412', marginTop: 0, marginBottom: '10px' }}>
          Transparent Volume-Based Pricing Across All Service Zones
        </h2>
        <p style={{ fontSize: '15px', color: '#7c2d12', marginBottom: '20px' }}>
          No county line surcharges, hidden dump fees, or unexpected fuel extras. You only pay for the truck bed volume you occupy:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>MINI Curbside</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$95 – $150</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Single armchair, microwave, 2-3 bags.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>1 Pickup Truck Bed</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$176 – $264</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Mattress + box spring, 3-seat sofa, table set.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>2 Pickup Loads</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$352 – $528</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Studio cleanout, sectional couch, yard brush.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Full Dump Truck</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$960 – $1,440</div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Full 2-car garage overhaul, office cleanout.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #ffedd5' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Dump Truck Plus</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>$1,560 – $2,400+</div>
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

      {/* Footer */}
      <footer style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <strong>{ctx.brandName} Territory Directory:</strong> Covering {allEntries.length} municipal service zone{allEntries.length === 1 ? '' : 's'} around {ctx.city}, {ctx.state}.
      </footer>
    </article>
  );
}
