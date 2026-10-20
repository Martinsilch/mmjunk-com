import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MUNICIPALITY_SLUGS = new Set([
  'federal-way',
  'auburn',
  'kent',
  'tacoma',
  'edgewood',
  'des-moines',
  'milton',
  'pacific',
  'algona',
  'covington',
  'maple-valley',
  'normandy-park',
  'renton',
  'seatac',
  'tukwila',
  'bonney-lake',
  'fife',
  'fircrest',
  'gig-harbor',
  'lakewood',
  'puyallup',
  'ruston',
  'sumner',
  'university-place',
  'south-seattle'
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass Next.js internals, API routes, and static asset requests with file extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Enforce lowercase URLs with a 301 Permanent Redirect for SEO canonicalization
  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  // Allow /locations root directory
  if (pathname === '/locations' || pathname === '/locations/') {
    return NextResponse.next();
  }

  // Handle legacy static pages from mamhad.com
  if (pathname === '/mm-junk-removal-south-king-pierce' || pathname === '/mm-junk-removal-south-king-pierce/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 301);
  }
  if (pathname === '/contact-us' || pathname === '/contact-us/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.hash = 'quote';
    return NextResponse.redirect(url, 301);
  }
  if (pathname === '/site-map' || pathname === '/site-map/') {
    const url = request.nextUrl.clone();
    url.pathname = '/sitemap.xml';
    return NextResponse.redirect(url, 301);
  }

  // Redirect /locations/* paths to canonical /junk-removal-[city]-wa spokes
  if (pathname.startsWith('/locations/')) {
    const raw = pathname.replace(/^\/locations\//, '').replace(/\/$/, '');
    const clean = raw.replace(/-junk-removal$/, '').replace(/^junk-removal-/, '').replace(/-wa$/, '');
    if (MUNICIPALITY_SLUGS.has(clean)) {
      const url = request.nextUrl.clone();
      url.pathname = `/junk-removal-${clean}-wa`;
      return NextResponse.redirect(url, 301);
    }
  }

  // Redirect legacy /[city]-junk-removal paths (e.g. /algona-junk-removal, /des-moines-junk-removal)
  const legacyJunkMatch = pathname.match(/^\/([a-z-]+)-junk-removal\/?$/);
  if (legacyJunkMatch && MUNICIPALITY_SLUGS.has(legacyJunkMatch[1])) {
    const url = request.nextUrl.clone();
    url.pathname = `/junk-removal-${legacyJunkMatch[1]}-wa`;
    return NextResponse.redirect(url, 301);
  }

  // Redirect bare city names (e.g. /auburn, /tacoma, /puyallup) to their canonical spoke
  const bareCity = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (MUNICIPALITY_SLUGS.has(bareCity)) {
    const url = request.nextUrl.clone();
    url.pathname = `/junk-removal-${bareCity}-wa`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js, .txt, .xml, .json, .woff, .woff2)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
};
