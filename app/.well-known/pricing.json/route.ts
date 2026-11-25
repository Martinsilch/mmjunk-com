import { NextResponse } from 'next/server';
import { getContractorContext, getDynamicServices } from '@/lib/business-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [ctx, services] = await Promise.all([
    getContractorContext(),
    getDynamicServices(),
  ]);

  const loadRates = Array.isArray((ctx.pricing as any)?.loadRates)
    ? (ctx.pricing as any).loadRates
    : [];

  return NextResponse.json(
    {
      schemaVersion: '1.0',
      provider: ctx.brandName,
      canonicalUrl: ctx.canonicalUrl,
      bookingUrl: ctx.bookingUrl,
      pricingModel: {
        type: 'volume_and_service_based',
        freeEstimates: (ctx.pricing as any)?.freeEstimates ?? true,
        upfrontPricing: (ctx.pricing as any)?.upfrontPricing ?? true,
        minimumLoadPriceUsd: (ctx.pricing as any)?.minimumLoadPrice ?? null,
        loadRates,
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
