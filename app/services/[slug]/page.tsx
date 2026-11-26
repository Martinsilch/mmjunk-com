import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getContractorContext, getEffectiveReputation } from '@/lib/business-context';

interface ServicePageProps {
  params: { slug: string };
}

export const revalidate = false;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const services = await db.serviceOffering.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return services.map(s => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const ctx = await getContractorContext();
  const svc = await db.serviceOffering.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!svc) {
    return { title: `${ctx.brandName} | Services` };
  }
  return {
    title: `${svc.name} in ${ctx.city}, ${ctx.state} | ${ctx.brandName}`,
    description: `${svc.shortDescription} Book upfront volume-based ${svc.name.toLowerCase()} with ${ctx.brandName}.`,
    alternates: {
      canonical: `${ctx.canonicalUrl}/services/${svc.slug}`,
    },
  };
}

export default async function DynamicServiceDetailPage({ params }: ServicePageProps) {
  const [ctx, svc, reputation] = await Promise.all([
    getContractorContext(),
    db.serviceOffering
      .findUnique({
        where: { slug: params.slug },
        include: {
          jobs: {
            where: { isPublished: true },
            include: { location: true },
            orderBy: { completedAt: 'desc' },
            take: 10,
          },
        },
      })
      .catch(() => null),
    getEffectiveReputation(),
  ]);

  if (!svc || !svc.isActive) {
    notFound();
  }

  const canonicalUrl = `${ctx.canonicalUrl}/services/${svc.slug}`;

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${canonicalUrl}#service`,
        name: svc.name,
        serviceType: svc.category,
        description: svc.longDescription || svc.shortDescription,
        provider: {
          '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
          '@id': `${ctx.canonicalUrl}/#business`,
          name: ctx.brandName,
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
        },
        areaServed: {
          '@type': 'City',
          name: `${ctx.city}, ${ctx.state}`,
        },
      },
    ],
  };

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo;{' '}
        <Link href="/services" style={{ color: '#2563eb', textDecoration: 'none' }}>Services</Link> &rsaquo;{' '}
        <span style={{ color: '#374151', fontWeight: 600 }}>{svc.name}</span>
      </nav>

      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#fff7ed', color: '#ea580c', padding: '4px 10px', borderRadius: '9999px' }}>
            {svc.category}
          </span>
          {svc.autoDiscovered && (
            <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '9999px' }}>
              Field-Verified Specialty
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', margin: '0 0 12px 0' }}>
          {svc.name} in {ctx.city}, {ctx.state}
        </h1>
        <p style={{ fontSize: '17px', color: '#4b5563', margin: '0 0 20px 0' }}>
          {svc.longDescription || svc.shortDescription}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href={ctx.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#ea580c', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '15px' }}
          >
            Book {svc.name} Online &rsaquo;
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
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 14px 0' }}>
          Verified Field Logs for {svc.name}
        </h2>
        {svc.jobs.length === 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: '#f9fafb', color: '#4b5563' }}>
            Available for immediate dispatch across {ctx.city}, {ctx.state}. Completed field logs and disposal receipts publish here as jobs finish.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {svc.jobs.map(job => (
              <div key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '16px', color: '#111827' }}>
                    {job.itemCategory} in {job.location?.cityName || ctx.city}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {job.weightLbs ? `${job.weightLbs.toLocaleString()} lbs` : 'Verified volume'}
                    {job.disposalSite ? ` • ${job.disposalSite}` : ''}
                  </span>
                </div>
                {job.customerReview && (
                  <p style={{ margin: '6px 0', fontSize: '14px', color: '#374151', fontStyle: 'italic' }}>
                    &ldquo;{job.customerReview}&rdquo;
                  </p>
                )}
                {job.slug && (
                  <Link href={`/jobs/${job.slug}`} style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>
                    View Full Job Case Study &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
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
