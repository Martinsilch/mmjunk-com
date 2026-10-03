/**
 * Job Utility Functions: Canonical Slug Generation & Entity Deduplication
 * Supports automated ingestion from Amzy Dispatch, Google Reviews, and Meta webhooks.
 */

import { resolveMunicipality as resolveByLocation, AUTHORIZED_MUNICIPALITIES } from '@/lib/geo-resolver';

export interface JobSlugParams {
  service: string;
  item?: string;
  city: string;
  jobId: string;
}

export function generateJobSlug(
  arg1: string | JobSlugParams,
  arg2?: string,
  arg3?: string,
  arg4?: string
): string {
  let service: string;
  let item: string | undefined;
  let city: string;
  let jobId: string;

  if (typeof arg1 === 'object') {
    service = arg1.service;
    item = arg1.item;
    city = arg1.city;
    jobId = arg1.jobId;
  } else {
    service = arg1;
    item = arg2;
    city = arg3 || 'federal-way';
    jobId = arg4 || 'rev';
  }

  const isCommercial =
    (item && /commercial/i.test(item)) ||
    (service && /commercial/i.test(service));

  let baseService = service.toLowerCase().trim();
  if (isCommercial && !baseService.includes('commercial')) {
    baseService = `commercial-${baseService}`;
  }

  const cleanService = baseService
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cleanCity = city
    .toLowerCase()
    .trim()
    .replace(/^junk-removal-/, '')
    .replace(/-wa$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cleanId = jobId
    .toLowerCase()
    .trim()
    .replace(/^amz-/, '')
    .replace(/^rev-/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${cleanService}-${cleanCity}-${cleanId}`;
}

export function extractFirstName(fullName?: string | null): string {
  if (!fullName) return '';
  const first = fullName.trim().toLowerCase().split(/\s+/)[0] || '';
  return first.replace(/[^a-z0-9]/g, '');
}

export function serviceMatches(s1?: string | null, s2?: string | null): boolean {
  if (!s1 || !s2) return false;
  const clean1 = s1.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const clean2 = s2.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const stopWords = new Set(['junk', 'removal', 'hauling', 'and', '&', 'service', 'cleanout', 'extraction']);
  const words1 = clean1.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const words2 = clean2.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));

  if (words1.length === 0 || words2.length === 0) return true;
  return words1.some(w => words2.includes(w));
}

/**
 * Enhanced municipality resolver that inspects direct tokens and parses narrative text
 * for authorized municipality mentions (e.g. "Martin helped us in Auburn").
 */
export function resolveMunicipality(input: string): string | null {
  if (!input) return null;

  // 1. Direct match (city name or ZIP code)
  const directMatch = resolveByLocation(input);
  if (directMatch) return directMatch.cityName;

  // 2. Scan text for authorized municipality keywords
  const textLower = ` ${input.toLowerCase().replace(/[^a-z0-9]/g, ' ')} `;
  for (const meta of Object.values(AUTHORIZED_MUNICIPALITIES)) {
    const cityPattern = new RegExp(`\\b${meta.cityName.toLowerCase()}\\b`, 'i');
    if (cityPattern.test(textLower)) {
      return meta.cityName;
    }
  }

  // 3. Scan for ZIP codes within text
  for (const meta of Object.values(AUTHORIZED_MUNICIPALITIES)) {
    for (const zip of meta.zipCodes) {
      if (textLower.includes(` ${zip} `)) {
        return meta.cityName;
      }
    }
  }

  return null;
}
