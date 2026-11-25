import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { getContractorContext, getDynamicServices, getEffectiveReputation } from '@/lib/business-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getContractorContext();

  if (ctx.isConfiguredFromDb || ctx.isColdStartEnv) {
    const [services, spokes, rep] = await Promise.all([
      getDynamicServices(),
      db.locationSpoke.findMany({ orderBy: [{ isPrimaryHub: 'desc' }, { distanceMiles: 'asc' }] }).catch(() => []),
      getEffectiveReputation(),
    ]);

    const manifest = {
      schemaVersion: '1.0',
      provider: {
        name: ctx.brandName,
        legalName: ctx.legalName,
        url: ctx.canonicalUrl,
        telephone: ctx.phone || null,
        email: ctx.email,
        bookingUrl: ctx.bookingUrl,
        baseLocation: {
          street: ctx.street,
          city: ctx.city,
          county: ctx.county,
          state: ctx.state,
          postalCode: ctx.postalCode,
          country: ctx.country,
          coordinates: { lat: ctx.lat, lng: ctx.lng },
        },
      },
      reputation: rep.reviewCount > 0 && rep.ratingValue
        ? {
            ratingValue: rep.ratingValue,
            reviewCount: rep.reviewCount,
            characterSignals: rep.characterSignals,
          }
        : {
            ratingValue: null,
            reviewCount: 0,
            characterSignals: rep.characterSignals,
          },
      services: services.map(s => ({
        slug: s.slug,
        name: s.name,
        category: s.category,
        url: `${ctx.canonicalUrl}/services/${s.slug}`,
        autoDiscovered: s.autoDiscovered,
      })),
      serviceArea: spokes.map(sp => ({
        slug: sp.slug,
        city: sp.cityName,
        state: sp.state,
        county: sp.county,
        postalCodes: sp.zipCodes,
        url: `${ctx.canonicalUrl}/junk-removal-${sp.slug}-${sp.state.toLowerCase()}`,
      })),
      endpoints: {
        llmsTxt: `${ctx.canonicalUrl}/llms.txt`,
        services: `${ctx.canonicalUrl}/services`,
        locations: `${ctx.canonicalUrl}/locations`,
        jobs: `${ctx.canonicalUrl}/jobs`,
        sitemap: `${ctx.canonicalUrl}/sitemap.xml`,
      },
    };

    return NextResponse.json(manifest, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  const filePath = path.join(process.cwd(), 'public', '.well-known', 'agent.json');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
}
