import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getContractorContext, getEffectiveReputation } from '@/lib/business-context';

export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getContractorContext();
  return {
    title: `Verified Field Job Stories | ${ctx.brandName} — ${ctx.city}, ${ctx.state}`,
    description: `Verified field logs, weight receipts, and customer feedback from completed ${ctx.brandName} hauling dispatches in ${ctx.city}, ${ctx.state}.`,
    alternates: {
      canonical: `${ctx.canonicalUrl}/jobs`,
    },
  };
}

export default async function JobsFeedPage() {
  const [ctx, jobs, reputation] = await Promise.all([
    getContractorContext(),
    db.jobStory
      .findMany({
        where: { isPublished: true },
        include: { location: true, service: true },
        orderBy: { completedAt: 'desc' },
        take: 40,
      })
      .catch(() => []),
    getEffectiveReputation(),
  ]);

  return (
    <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <nav style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo;{' '}
        <span style={{ color: '#374151', fontWeight: 600 }}>Verified Field Jobs</span>
      </nav>

      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', margin: '0 0 12px 0' }}>
          Verified Field Job Stories &amp; Telemetry
        </h1>
        <p style={{ fontSize: '17px', color: '#4b5563', maxWidth: '760px', margin: '0 0 18px 0' }}>
          Real-world junk removal, estate cleanout, and dismantling logs completed by {ctx.brandName} across {ctx.city}, {ctx.state} and surrounding communities.
        </p>
        {reputation.reviewCount > 0 && reputation.aggregateRating && (
          <div style={{ display: 'inline-block', backgroundColor: '#ecfdf5', color: '#065f46', padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700 }}>
            {reputation.aggregateRating} &#9733; ({reputation.reviewCount} verified reviews)
          </div>
        )}
      </header>

      {jobs.length === 0 ? (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', backgroundColor: '#f9fafb', textAlign: 'center', color: '#4b5563' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
            Collecting First Verified Field Jobs
          </h2>
          <p style={{ margin: '0 0 18px 0' }}>
            Verified case studies, disposal weight receipts, and customer reviews publish here automatically after completed AMZY dispatches.
          </p>
          <a
            href={ctx.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', backgroundColor: '#ea580c', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '14px' }}
          >
            Book Online via AMZY &rsaquo;
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          {jobs.map(job => (
            <article key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#ea580c', fontWeight: 700 }}>
                  <span>{job.location?.cityName || ctx.city}, {job.location?.state || ctx.state}</span>
                  <span>{job.weightLbs ? `${job.weightLbs.toLocaleString()} lbs` : 'Verified Load'}</span>
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
                  {job.serviceType}
                </h2>
                <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 12px 0' }}>
                  {job.itemCategory}
                  {job.disposalSite ? ` — Routed to ${job.disposalSite}` : ''}
                </p>
                {job.customerReview && (
                  <blockquote style={{ margin: '0 0 12px 0', paddingLeft: '10px', borderLeft: '3px solid #ea580c', fontSize: '13px', fontStyle: 'italic', color: '#374151' }}>
                    &ldquo;{job.customerReview}&rdquo;
                  </blockquote>
                )}
              </div>
              {job.slug && (
                <Link href={`/jobs/${job.slug}`} style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                  View Full Case Study &amp; Telemetry &rarr;
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          Direct Dispatch: <a href={`tel:${ctx.phone}`} style={{ color: '#ea580c', fontWeight: 700 }}>{ctx.phone}</a> &bull; Serving {ctx.city}, {ctx.state} and surrounding areas
        </p>
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
