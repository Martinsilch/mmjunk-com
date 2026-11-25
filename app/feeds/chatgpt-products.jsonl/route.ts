import { NextResponse } from 'next/server';
import { generateChatGPTProductFeedJSONLAsync } from '@/lib/feeds/chatgptProductFeed';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const jsonl = await generateChatGPTProductFeedJSONLAsync();

  // Smart browser detection: if human browser requests text/html or specifies ?format=text or ?view=browser,
  // return text/plain so Chrome renders the JSON lines directly on screen without triggering a "Save As" download.
  // For crawlers/APIs, return the official application/x-ndjson MIME type.
  const accept = request?.headers?.get('accept') || '';
  const url = new URL(request?.url || 'https://www.mmjunk.com/feeds/chatgpt-products.jsonl');
  const format = url.searchParams.get('format') || url.searchParams.get('view');

  const isBrowser = format === 'text' || format === 'browser' || (accept.includes('text/html') && !accept.includes('application/x-ndjson'));
  const contentType = isBrowser ? 'text/plain; charset=utf-8' : 'application/x-ndjson; charset=utf-8';

  return new NextResponse(jsonl, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline; filename="chatgpt-products.jsonl"',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Content-Disposition': 'inline; filename="chatgpt-products.jsonl"',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
