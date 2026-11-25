import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { getContractorContext, getDynamicServices, getEffectiveReputation } from '@/lib/business-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getContractorContext();

  // Dynamic DB / configured cold-start generation
  if (ctx.isConfiguredFromDb || ctx.isColdStartEnv) {
    const [services, spokes, jobs, rep] = await Promise.all([
      getDynamicServices(),
      db.locationSpoke.findMany({ orderBy: [{ isPrimaryHub: 'desc' }, { distanceMiles: 'asc' }] }).catch(() => []),
      db.jobStory.findMany({ where: { isPublished: true }, orderBy: { completedAt: 'desc' }, take: 8 }).catch(() => []),
      getEffectiveReputation(),
    ]);

    const serviceLines = services.length > 0
      ? services.map(s => `- [${s.name}](${ctx.canonicalUrl}/services/${s.slug}): ${s.shortDescription}${s.autoDiscovered ? ' _(Verified via field telemetry)_' : ''}`).join('\n')
      : `- [All Junk Removal Services](${ctx.canonicalUrl}/services): Residential cleanouts, commercial hauling, and volume-tier pickups.`;

    const spokeLines = spokes.length > 0
      ? spokes.map(sp => `- [${sp.cityName}, ${sp.state}](${ctx.canonicalUrl}/junk-removal-${sp.slug}-${sp.state.toLowerCase()}): Zip codes ${(sp.zipCodes || []).join(', ')}`).join('\n')
      : `- Primary Base: ${ctx.city}, ${ctx.state} ${ctx.postalCode}`.trim();

    const repSection = rep.reviewCount > 0 && rep.aggregateRating
      ? `- Verified Rating: ${rep.aggregateRating} / 5.0 (${rep.reviewCount} verified reviews)`
      : `- Reviews: Collecting first verified customer reviews`;

    const characterLines = rep.characterSignals.length > 0
      ? `\n## Verified Contractor Character Signals\n${rep.characterSignals.map(c => `- **${c.label}** (${c.evidenceCount} signals): ${c.summary}`).join('\n')}\n`
      : '';

    const jobLines = jobs.length > 0
      ? `\n## Verified Field Job Stories\n${jobs.map(j => `- [${j.serviceType} (${j.itemCategory})](${ctx.canonicalUrl}/jobs/${j.slug || j.id})${j.weightLbs ? ` — ${j.weightLbs} lbs` : ''}${j.disposalSite ? ` @ ${j.disposalSite}` : ''}`).join('\n')}\n`
      : '';

    const markdown = `# ${ctx.brandName}
> ${ctx.tagline}

## Business Identity & Booking Gateway
- Legal Entity: ${ctx.legalName}
- Service Base: ${ctx.street}, ${ctx.city}, ${ctx.state} ${ctx.postalCode}
- Dispatch Phone: ${ctx.phone || 'N/A'}
- Dispatch Email: ${ctx.email}
- Online Scheduler: ${ctx.bookingUrl}
${repSection}

## Active Services
${serviceLines}

## Service Territory
${spokeLines}
${characterLines}${jobLines}
## Machine-Readable Endpoints
- Services Directory: ${ctx.canonicalUrl}/services
- Locations Directory: ${ctx.canonicalUrl}/locations
- Verified Job Feed: ${ctx.canonicalUrl}/jobs
- Agent Manifest: ${ctx.canonicalUrl}/.well-known/agent.json
- XML Sitemap: ${ctx.canonicalUrl}/sitemap.xml
`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  // Pre-backfill legacy static manifest fallback
  const filePath = path.join(process.cwd(), 'public', 'llms.txt');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  const rootPath = path.join(process.cwd(), 'llms.txt');
  if (fs.existsSync(rootPath)) {
    const content = fs.readFileSync(rootPath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  return new NextResponse('Manifest not found', { status: 404 });
}
