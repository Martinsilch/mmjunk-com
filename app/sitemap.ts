import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';
import { getContractorContext, getDynamicServices } from '@/lib/business-context';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ctx = await getContractorContext();
  const baseUrl = ctx.canonicalUrl;
  const currentDate = new Date().toISOString().split('T')[0];

  const baseRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/locations`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/jobs`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/privacy-policy`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Dynamic ServiceOffering URLs from DB (falls back to M&M static list ONLY if pre-backfill legacy)
  const dbServices = await getDynamicServices();
  const serviceRoutes: MetadataRoute.Sitemap =
    dbServices.length > 0
      ? dbServices.map(s => ({
          url: `${baseUrl}/services/${s.slug}`,
          lastModified: s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.88,
        }))
      : !ctx.isColdStartEnv
      ? [
          'residential',
          'commercial',
          'industrial',
          'sorting-donation',
          'recurring',
          'contractual',
          'commercial-appliance-removal',
          'estate-cleanout',
          'construction-debris-removal',
          'residential-furniture-removal',
          'hot-tub-demolition-removal',
          'yard-waste-removal',
        ].map(slug => ({
          url: `${baseUrl}/services/${slug}`,
          lastModified: currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.88,
        }))
      : [];

  // Dynamic LocationSpoke URLs scoped strictly to this contractor
  let spokeRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbSpokes = await db.locationSpoke.findMany({ select: { slug: true, state: true, updatedAt: true } });
    if (dbSpokes.length > 0) {
      spokeRoutes = dbSpokes.map(s => ({
        url: `${baseUrl}/junk-removal-${s.slug}-${(s.state || ctx.state || 'wa').toLowerCase()}`,
        lastModified: s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : currentDate,
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    } else if (!ctx.isConfiguredFromDb && !ctx.isColdStartEnv) {
      spokeRoutes = Object.keys(AUTHORIZED_MUNICIPALITIES).map(slug => ({
        url: `${baseUrl}/junk-removal-${slug}-wa`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }
  } catch {
    if (!ctx.isConfiguredFromDb && !ctx.isColdStartEnv) {
      spokeRoutes = Object.keys(AUTHORIZED_MUNICIPALITIES).map(slug => ({
        url: `${baseUrl}/junk-removal-${slug}-wa`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }
  }

  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbJobs = await db.jobStory.findMany({
      where: {
        isPublished: true,
        slug: { not: null },
        NOT: [{ slug: { contains: 'test' } }],
      },
      select: { slug: true, completedAt: true },
    });

    jobRoutes = dbJobs.map(job => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.completedAt ? new Date(job.completedAt).toISOString().split('T')[0] : currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));
  } catch {
    // DB offline fallback
  }

  return [...baseRoutes, ...serviceRoutes, ...spokeRoutes, ...jobRoutes];
}
