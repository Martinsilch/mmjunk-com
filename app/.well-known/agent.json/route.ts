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

    const baseUrl = ctx.canonicalUrl.replace(/\/$/, '');
    const pricingObj = (ctx.pricing as Record<string, any>) || {};
    const volumeTiers = Array.isArray(pricingObj.volumeTiers) ? pricingObj.volumeTiers : [];

    const manifest = {
      schemaVersion: '1.0',
      schema_version: '1.0.0',
      agent_id: `${ctx.domain || 'www.mmjunk.com'}.dispatch`,
      name: `${ctx.brandName} Federated Agent Manifest`,
      description: ctx.tagline,
      canonical_url: baseUrl,
      provider: {
        name: ctx.brandName,
        trade_name: ctx.brandName,
        legalName: ctx.legalName,
        legal_name: ctx.legalName,
        ...(ctx.ownerName ? { founder: ctx.ownerName } : {}),
        ...(ctx.foundedYear ? { established: ctx.foundedYear } : {}),
        url: baseUrl,
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
        ...(ctx.sameAsUrls.length > 0 ? { verification_profiles: ctx.externalLinks } : {}),
      },
      ...(Object.keys(ctx.fleet || {}).length > 0 ? { fleet_specifications: ctx.fleet } : {}),
      ...(volumeTiers.length > 0 ? { pricing_tiers: volumeTiers } : {}),
      ...(pricingObj.rateGuarantee ? { rate_guarantee: pricingObj.rateGuarantee } : {}),
      ...(pricingObj.sameDayCutoff ? { same_day_cutoff: pricingObj.sameDayCutoff } : {}),
      dispatch_infrastructure: {
        provider: 'AMZY Platform',
        platform_url: 'https://amzy.me',
        booking_handoff_url: ctx.bookingUrl,
      },
      reputation:
        rep.reviewCount > 0 && rep.ratingValue
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
      services: services.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category,
        url: `${baseUrl}/services/${s.slug}`,
        autoDiscovered: s.autoDiscovered,
      })),
      serviceArea: spokes.map((sp) => ({
        slug: sp.slug,
        city: sp.cityName,
        state: sp.state,
        county: sp.county,
        postalCodes: sp.zipCodes,
        url: `${baseUrl}/junk-removal-${sp.slug}-${sp.state.toLowerCase()}`,
      })),
      endpoints: {
        llmsTxt: `${baseUrl}/llms.txt`,
        llmsFullTxt: `${baseUrl}/llms-full.txt`,
        pricingJson: `${baseUrl}/.well-known/pricing.json`,
        agentJson: `${baseUrl}/.well-known/agent.json`,
        feedJsonl: `${baseUrl}/feeds/chatgpt-products.jsonl`,
        services: `${baseUrl}/services`,
        locations: `${baseUrl}/locations`,
        jobs: `${baseUrl}/jobs`,
        sitemap: `${baseUrl}/sitemap.xml`,
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

  const filePath = path.join(process.cwd(), '.well-known', 'agent.json');
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
