import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getContractorContext, getDynamicServices } from '@/lib/business-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [ctx, services] = await Promise.all([
    getContractorContext(),
    getDynamicServices(),
  ]);

  const pricingObj = (ctx.pricing as Record<string, any>) || {};
  const loadRates = Array.isArray(pricingObj.loadRates) ? pricingObj.loadRates : [];
  const volumeTiers = Array.isArray(pricingObj.volumeTiers) ? pricingObj.volumeTiers : [];

  if (!ctx.isConfiguredFromDb && !ctx.isColdStartEnv) {
    const staticPricingPath = path.join(process.cwd(), '.well-known', 'pricing.json');
    if (fs.existsSync(staticPricingPath)) {
      const content = fs.readFileSync(staticPricingPath, 'utf8');
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  return NextResponse.json(
    {
      schemaVersion: '1.0',
      provider: ctx.brandName,
      canonicalUrl: ctx.canonicalUrl,
      bookingUrl: ctx.bookingUrl,
      pricingModel: {
        type: 'volume_and_service_based',
        freeEstimates: pricingObj.freeEstimates ?? true,
        upfrontPricing: pricingObj.upfrontPricing ?? true,
        minimumLoadPriceUsd: pricingObj.minimumLoadPrice ?? null,
        rateGuarantee: pricingObj.rateGuarantee ?? null,
        sameDayCutoff: pricingObj.sameDayCutoff ?? null,
        loadRates,
        volumeTiers,
      },
      services: services.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category,
        basePriceUsd: s.basePrice,
        estimatedTimeHours: s.estimatedTimeHours,
        url: `${ctx.canonicalUrl}/services/${s.slug}`,
      })),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
