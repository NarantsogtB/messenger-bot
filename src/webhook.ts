import { Context } from 'hono';
import { Env } from './types';

export const verifyWebhook = (c: Context<{ Bindings: Env }>) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === c.env.MESSENGER_VERIFY_TOKEN) {
    return c.text(challenge || '');
  }
  return c.text('Forbidden', 403);
};

// Signature verification helper (simplified for step 1, assuming sha256)
export async function verifySignature(request: Request, body: string, secret: string): Promise<boolean> {
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = hexToBytes(signature.split('=')[1]);
  const bodyBytes = encoder.encode(body);

  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    bodyBytes
  );
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
