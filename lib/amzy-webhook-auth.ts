import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

export interface WebhookAuthResult {
  authorized: boolean;
  mode: 'hmac' | 'token' | 'open_dev';
  error?: string;
}

/**
 * Verifies inbound AMZY webhook authenticity.
 * Supports:
 *   1. Signed HMAC-SHA256 (`x-amzy-signature: sha256=<hex>` + `x-amzy-timestamp` over `${ts}.${rawBody}`)
 *   2. Static bearer / secret headers (`Authorization: Bearer <secret>`, `x-webhook-secret`, `x-amzy-secret`, `?token=`)
 */
export function verifyAmzyWebhookRequest(
  req: NextRequest | Request,
  rawBody: string
): WebhookAuthResult {
  const expectedSecrets = [
    process.env.AMZY_WEBHOOK_SECRET,
    process.env.DISPATCH_WEBHOOK_SECRET,
    process.env.WEBHOOK_SECRET,
  ].filter((v): v is string => Boolean(v && v.trim()));

  if (expectedSecrets.length === 0) {
    return { authorized: true, mode: 'open_dev' };
  }

  const signatureHeader =
    req.headers.get('x-amzy-signature') || req.headers.get('x-signature');
  const timestampHeader =
    req.headers.get('x-amzy-timestamp') || req.headers.get('x-timestamp');

  if (signatureHeader) {
    if (!timestampHeader) {
      return {
        authorized: false,
        mode: 'hmac',
        error: 'Unauthorized: Missing required X-Amzy-Timestamp header',
      };
    }

    const tsClean = String(timestampHeader).split(',')[0].trim();
    const tsSec = Number(tsClean);
    const nowSec = Math.floor(Date.now() / 1000);
    if (Number.isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
      return {
        authorized: false,
        mode: 'hmac',
        error: 'Unauthorized: Webhook timestamp expired or out of tolerance',
      };
    }

    const cleanSig = String(signatureHeader)
      .split(',')[0]
      .trim()
      .replace(/^sha256=/i, '');
    const signedPayload = `${tsClean}.${rawBody}`;

    const matched = expectedSecrets.some((secret) => {
      try {
        const expected = crypto
          .createHmac('sha256', secret)
          .update(signedPayload)
          .digest('hex');
        if (cleanSig.length !== expected.length) return false;
        return crypto.timingSafeEqual(
          Buffer.from(cleanSig, 'hex'),
          Buffer.from(expected, 'hex')
        );
      } catch {
        return false;
      }
    });

    if (!matched) {
      return {
        authorized: false,
        mode: 'hmac',
        error: 'Unauthorized: Invalid X-Amzy-Signature HMAC digest',
      };
    }

    return { authorized: true, mode: 'hmac' };
  }

  // Fallback: Token header / query authentication
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : null;
  const secretHeader =
    req.headers.get('x-webhook-secret') || req.headers.get('x-amzy-secret');

  const candidate = bearerToken || secretHeader || queryToken;
  if (candidate && expectedSecrets.includes(candidate)) {
    return { authorized: true, mode: 'token' };
  }

  return {
    authorized: false,
    mode: 'token',
    error: 'Unauthorized: invalid or missing webhook signature/secret token',
  };
}
