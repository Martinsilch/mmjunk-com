import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getContractorContext, getDynamicServices, getEffectiveReputation } from '@/lib/business-context';

export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getContractorContext();
  return {
    title: `Junk Removal Services | ${ctx.brandName} — ${ctx.city}, ${ctx.state}`,
    description: `Upfront flat-rate junk removal and hauling services from ${ctx.brandName} in ${ctx.city}, ${ctx.state}. Browse active residential, commercial, and specialty services.`,
    alternates: {
      canonical: `${ctx.canonicalUrl}/services`,
    },
  };
}

export default async function ServicesDirectoryPage() {
  const [ctx, services, reputation, recentJobsCount] = await Promise.all([
    getContractorContext(),
    getDynamicServices(),
    getEffectiveReputation(),
    db.jobStory.count({ where: { isPublished: true } }).catch(() => 0),
  ]);

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'HomeAndConstructionBusiness', 'RecyclingCenter'],
        '@id': `${ctx.canonicalUrl}/services/#business`,
        name: ctx.brandName,
        url: `${ctx.canonicalUrl}/services`,
        ...(ctx.phone ? { telephone: ctx.phone } : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: ctx.street,
          addressLocality: ctx.city,
          addressRegion: ctx.state,
          postalCode: ctx.postalCode,
          addressCountry: ctx.country,
        },
        ...(reputation.reviewCount > 0 && reputation.aggregateRating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: reputation.aggregateRating,
                reviewCount: String(reputation.reviewCount),
                bestRating: '5',
              },
            }
          : {}),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `${ctx.brandName} Services`,
          itemListElement: services.map(svc => ({
            '@type': 'Offer',
            url: `${ctx.canonicalUrl}/services/${svc.slug}`,
            itemOffered: {
              '@type': 'Service',
              name: svc.name,
              description: svc.shortDescription,
            },
          })),
        },
      },
    ],
  };

  return (
    <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo;{' '}
        <span style={{ color: '#374151', fontWeight: 600 }}>Services</span>
      </nav>

      <header style={{ marginBottom: '36px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', margin: '0 0 12px 0' }}>
          Junk Removal &amp; Hauling Services in {ctx.city}, {ctx.state}
        </h1>
        <p style={{ fontSize: '17px', color: '#4b5563', maxWidth: '760px', margin: '0 0 20px 0' }}>
          {ctx.description}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href={ctx.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#ea580c', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '15px' }}
          >
            Book Online via AMZY &rsaquo;
          </a>
          {ctx.phone && (
            <a
              href={`tel:${ctx.phone.replace(/[^0-9+]/g, '')}`}
              style={{ border: '1px solid #d1d5db', color: '#111827', padding: '12px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}
            >
              Call {ctx.displayPhone || ctx.phone}
            </a>
          )}
        </div>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
            Active Service Offerings ({services.length})
          </h2>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            {recentJobsCount > 0 ? `${recentJobsCount} verified field jobs logged` : 'New services expand automatically as field work completes'}
          </span>
        </div>

        {services.length === 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', backgroundColor: '#f9fafb', color: '#4b5563' }}>
            Full-service residential cleanouts, commercial hauling, and single-item pickups available in {ctx.city}, {ctx.state}. Request a free estimate online or by phone.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {services.map(svc => (
              <Link
                key={svc.id}
                href={`/services/${svc.slug}`}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#ffffff', textDecoration: 'none', color: '#111827' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>
                      {svc.category}
                    </span>
                    {svc.autoDiscovered && (
                      <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '9999px' }}>
                        Verified Field Capability
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 8px 0' }}>{svc.name}</h3>
                  <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 12px 0' }}>{svc.shortDescription}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                  <span>
                    {svc._count?.jobs ? `${svc._count.jobs} field log${svc._count.jobs === 1 ? '' : 's'}` : 'Learn more'}
                  </span>
                  <span>View service &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {reputation.characterSignals.length > 0 && (
        <section style={{ marginBottom: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
            Verified Contractor Character &amp; Track Record
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {reputation.characterSignals.map(sig => (
              <div key={sig.dimension} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{sig.label}</div>
                <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0' }}>{sig.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        &copy; {new Date().getFullYear()} {ctx.legalName}. All rights reserved. &bull;{' '}
        <a
          href="https://amzy-agency.vercel.app/#pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#ea580c', textDecoration: 'underline' }}
        >
          This web application is built and managed by Amzy Agency
        </a>
      </footer>
    </main>
  );
}
