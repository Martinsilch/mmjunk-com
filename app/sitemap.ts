import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';

export const revalidate = 3600; // Revalidate at least hourly or on-demand via revalidateTag('root-sitemap')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mmjunk.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/residential`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/commercial`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/industrial`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/sorting-donation`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/recurring`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/contractual`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/commercial-appliance-removal`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/estate-cleanout`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/construction-debris-removal`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/residential-furniture-removal`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/hot-tub-demolition-removal`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/services/yard-waste-removal`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/jobs`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/privacy-policy`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Fetch all location spokes from DB and fallback map
  let spokeSlugs = new Set<string>(Object.keys(AUTHORIZED_MUNICIPALITIES));
  try {
    const dbSpokes = await db.locationSpoke.findMany({ select: { slug: true } });
    for (const s of dbSpokes) {
      spokeSlugs.add(s.slug);
    }
  } catch {
    // DB offline fallback
  }

  const spokeRoutes: MetadataRoute.Sitemap = Array.from(spokeSlugs).map((slug) => ({
    url: `${baseUrl}/junk-removal-${slug}-wa`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9
  }));

  // Fetch all completed jobs with canonical slugs (excluding testing records)
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbJobs = await db.jobStory.findMany({
      where: {
        slug: { not: null },
        NOT: [
          { slug: { contains: 'test' } }
        ]
      },
      select: { slug: true, completedAt: true }
    });

    jobRoutes = dbJobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.completedAt ? new Date(job.completedAt).toISOString().split('T')[0] : currentDate,
      changeFrequency: 'monthly',
      priority: 0.8
    }));
  } catch {
    // DB offline fallback
  }

  return [...staticRoutes, ...spokeRoutes, ...jobRoutes];
}
