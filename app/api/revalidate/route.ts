import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { z } from 'zod';

const RevalidateSchema = z.object({
  secret: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  paths: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = RevalidateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const expectedSecrets = [
    process.env.EDGE_REVALIDATE_SECRET,
    process.env.AMZY_WEBHOOK_SECRET,
    process.env.DISPATCH_WEBHOOK_SECRET,
  ].filter((v): v is string => Boolean(v && v.trim()));

  if (expectedSecrets.length > 0) {
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null;
    const provided = parsed.data.secret || bearer || req.headers.get('x-revalidate-secret');
    if (!provided || !expectedSecrets.includes(provided)) {
      return NextResponse.json({ error: 'Unauthorized revalidation secret' }, { status: 401 });
    }
  }

  const invalidatedTags: string[] = [];
  for (const tag of parsed.data.tags) {
    try {
      revalidateTag(tag);
      invalidatedTags.push(tag);
    } catch (err) {
      console.warn(`[Revalidate] Tag warning (${tag}):`, err);
    }
  }

  const defaultPaths = ['/', '/services', '/locations', '/jobs', '/llms.txt', '/sitemap.xml'];
  const targetPaths = Array.from(new Set([...defaultPaths, ...parsed.data.paths]));
  const invalidatedPaths: string[] = [];

  for (const path of targetPaths) {
    try {
      revalidatePath(path);
      invalidatedPaths.push(path);
    } catch (err) {
      console.warn(`[Revalidate] Path warning (${path}):`, err);
    }
  }

  return NextResponse.json({
    revalidated: true,
    tags: invalidatedTags,
    paths: invalidatedPaths,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/revalidate',
    accepts: ['POST'],
  });
}
