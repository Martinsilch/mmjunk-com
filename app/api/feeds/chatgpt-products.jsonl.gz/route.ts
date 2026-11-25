import { NextResponse } from 'next/server';
import { generateChatGPTProductFeedGzipAsync } from '@/lib/feeds/chatgptProductFeed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gzipped = await generateChatGPTProductFeedGzipAsync();

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
