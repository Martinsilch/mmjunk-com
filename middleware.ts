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

  // Enforce canonical hostname (redirect apex mmjunk.com or vercel.app previews to www.mmjunk.com)
  const host = request.headers.get('host') || '';
  if (host === 'mmjunk.com' || (host.endsWith('.vercel.app') && !host.includes('localhost') && !host.includes('127.0.0.1'))) {
    const url = request.nextUrl.clone();
    url.host = 'www.mmjunk.com';
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

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

  // 50/50 A/B Experiment Cookie Assignment for Root Homepage
  const response = NextResponse.next();
  if (pathname === '/') {
    const existingCookie = request.cookies.get('mm_hero_ab')?.value;
    if (!existingCookie) {
      const userAgent = request.headers.get('user-agent') || '';
      const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(userAgent);
      if (!isBot) {
        const assignedVariant = Math.random() < 0.5 ? 'control' : 'social';
        response.cookies.set('mm_hero_ab', assignedVariant, {
          maxAge: 60 * 60 * 24 * 30, // 30-day persistence
          path: '/',
          sameSite: 'lax',
        });
      }
    }
  }

  // Allow /locations root directory
  if (pathname === '/locations' || pathname === '/locations/') {
    return response;
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

  return response;
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
