import { NextResponse } from 'next/server';
import { generateChatGPTProductFeedGzip } from '@/lib/feeds/chatgptProductFeed';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  const gzipped = generateChatGPTProductFeedGzip();

  return new NextResponse(new Uint8Array(gzipped), {
    status: 200,
    headers: {
      'Content-Type': 'application/gzip',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
    }
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/gzip',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
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
