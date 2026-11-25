import Link from 'next/link';
import { db } from '@/lib/db';
import { getContractorContext, getEffectiveReputation } from '@/lib/business-context';

export const dynamic = 'force-dynamic';

export default async function ReputationPage() {
  const [ctx, rep, reviews] = await Promise.all([
    getContractorContext(),
    getEffectiveReputation(),
    db.customerReview
      .findMany({ where: { publishedToApp: true }, orderBy: { reviewDate: 'desc' }, take: 25 })
      .catch(() => []),
  ]);

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a', lineHeight: 1.6 }}>
      <nav style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link> &rsaquo; Reputation &amp; Character Profile
      </nav>

      <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0' }}>
        {ctx.brandName} — Verified Reputation &amp; Character Profile
      </h1>

      {rep.reviewCount > 0 && rep.aggregateRating ? (
        <p style={{ fontSize: '18px', color: '#334155', marginBottom: '28px' }}>
          <strong>{rep.aggregateRating} / 5.0 ★</strong> across <strong>{rep.reviewCount}</strong> verified reviews.
        </p>
      ) : (
        <p style={{ fontSize: '16px', color: '#475569', marginBottom: '28px' }}>
          Collecting first verified customer reviews and field telemetry for {ctx.brandName} in {ctx.city}, {ctx.state}.
        </p>
      )}

      {rep.characterSignals.length > 0 && (
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '14px' }}>Verified Character Signals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {rep.characterSignals.map((sig) => (
              <div key={sig.dimension} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#ffffff' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>{sig.label}</div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>{sig.summary}</p>
                <span style={{ fontSize: '12px', color: '#047857', fontWeight: 700 }}>
                  {sig.evidenceCount} verified field signals
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '14px' }}>Recent Customer Reviews</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            {reviews.map((rev) => (
              <blockquote key={rev.id} style={{ borderLeft: '4px solid #ea580c', backgroundColor: '#f8fafc', padding: '16px 20px', margin: 0 }}>
                <p style={{ margin: '0 0 8px 0', fontStyle: 'italic' }}>&ldquo;{rev.reviewText}&rdquo;</p>
                <footer style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  — {rev.authorName} ({rev.rating} ★ • {rev.platform}{rev.locationCity ? ` • ${rev.locationCity}` : ''})
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
