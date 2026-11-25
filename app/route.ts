import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { getContractorContext, getDynamicServices, getEffectiveReputation } from '@/lib/business-context';

export const dynamic = 'force-dynamic';

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const ctx = await getContractorContext();
  const staticIndexPath = path.join(process.cwd(), 'index.html');

  // Preserve M&M's rich existing landing page verbatim when in legacy pre-migration or static M&M mode
  if (!ctx.isConfiguredFromDb && !ctx.isColdStartEnv && fs.existsSync(staticIndexPath)) {
    const html = fs.readFileSync(staticIndexPath, 'utf-8');
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  }

  // Dynamic SSR Day-0 / DB-driven homepage for any contractor spawned from AMZY
  const [services, spokes, jobs, rep] = await Promise.all([
    getDynamicServices(),
    db.locationSpoke.findMany({ orderBy: [{ isPrimaryHub: 'desc' }, { distanceMiles: 'asc' }], take: 12 }).catch(() => []),
    db.jobStory.findMany({ where: { isPublished: true }, include: { location: true }, orderBy: { completedAt: 'desc' }, take: 6 }).catch(() => []),
    getEffectiveReputation(),
  ]);

  const jsonLdGraph: Record<string, any>[] = [
    {
      '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
      '@id': `${ctx.canonicalUrl}/#business`,
      name: ctx.brandName,
      url: ctx.canonicalUrl,
      ...(ctx.phone ? { telephone: ctx.phone } : {}),
      address: {
        '@type': 'PostalAddress',
        streetAddress: ctx.street,
        addressLocality: ctx.city,
        addressRegion: ctx.state,
        postalCode: ctx.postalCode,
        addressCountry: ctx.country,
      },
      ...(rep.reviewCount > 0 && rep.aggregateRating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: rep.aggregateRating,
              reviewCount: String(rep.reviewCount),
              bestRating: '5',
            },
          }
        : {}),
    },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(ctx.brandName)} | Junk Removal in ${escapeHtml(ctx.city)}, ${escapeHtml(ctx.state)}</title>
  <meta name="description" content="${escapeHtml(ctx.description)}" />
  <link rel="canonical" href="${escapeHtml(ctx.canonicalUrl)}" />
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLdGraph })}</script>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;color:#111827;background:#ffffff;line-height:1.6;">
  <main style="max-width:1040px;margin:0 auto;padding:40px 20px;">
    <header style="margin-bottom:40px;">
      <p style="font-size:13px;font-weight:700;color:#ea580c;text-transform:uppercase;margin:0 0 8px 0;">${escapeHtml(ctx.city)}, ${escapeHtml(ctx.state)} • Powered by AMZY</p>
      <h1 style="font-size:38px;font-weight:900;margin:0 0 12px 0;">${escapeHtml(ctx.brandName)}</h1>
      <p style="font-size:18px;color:#4b5563;max-width:720px;margin:0 0 24px 0;">${escapeHtml(ctx.description)}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${escapeHtml(ctx.bookingUrl)}" target="_blank" rel="noopener noreferrer" style="background:#ea580c;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:800;">Book Online via AMZY &rsaquo;</a>
        ${ctx.phone ? `<a href="tel:${escapeHtml(ctx.phone.replace(/[^0-9+]/g, ''))}" style="border:1px solid #d1d5db;color:#111827;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:700;">Call ${escapeHtml(ctx.displayPhone || ctx.phone)}</a>` : ''}
      </div>
    </header>

    <section style="margin-bottom:36px;">
      <h2 style="font-size:24px;font-weight:800;margin:0 0 14px 0;">Active Services</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
        ${services.map(s => `<a href="/services/${escapeHtml(s.slug)}" style="display:block;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-decoration:none;color:#111827;"><strong style="display:block;margin-bottom:6px;">${escapeHtml(s.name)}</strong><span style="font-size:14px;color:#4b5563;">${escapeHtml(s.shortDescription)}</span></a>`).join('')}
      </div>
    </section>

    <section style="margin-bottom:36px;">
      <h2 style="font-size:24px;font-weight:800;margin:0 0 14px 0;">Service Areas</h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${spokes.map(sp => `<a href="/junk-removal-${escapeHtml(sp.slug)}-${escapeHtml(sp.state.toLowerCase())}" style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;text-decoration:none;color:#111827;font-weight:600;">${escapeHtml(sp.cityName)}, ${escapeHtml(sp.state)}</a>`).join('')}
      </div>
    </section>

    ${jobs.length > 0 ? `<section style="margin-bottom:36px;"><h2 style="font-size:24px;font-weight:800;margin:0 0 14px 0;">Verified Field Jobs</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">${jobs.map(j => `<a href="/jobs/${escapeHtml(j.slug || j.id)}" style="display:block;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-decoration:none;color:#111827;"><strong>${escapeHtml(j.serviceType)}</strong><div style="font-size:13px;color:#4b5563;">${escapeHtml(j.itemCategory)} — ${escapeHtml(j.location?.cityName || ctx.city)}</div></a>`).join('')}</div></section>` : ''}

    <footer style="border-top:1px solid #e5e7eb;padding-top:20px;font-size:13px;color:#6b7280;">
      <strong>${escapeHtml(ctx.legalName)}</strong> &bull; ${escapeHtml(ctx.street)}, ${escapeHtml(ctx.city)}, ${escapeHtml(ctx.state)} ${escapeHtml(ctx.postalCode)} &bull; <a href="/services">Services</a> &bull; <a href="/locations">Locations</a> &bull; <a href="/jobs">Jobs</a> &bull; <a href="/llms.txt">llms.txt</a>
    </footer>
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
