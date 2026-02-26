import { Env } from './types';

export async function handleAssetRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.pathname.slice(1); // remove leading slash, e.g. "assets/rings/winter/best.png"
  
  // Basic security: ensure no traversing up logic? R2 get handles key literally usually, but good to be careful.
  // In this simple case, we map pathname directly to object key.
  
  if (!key.startsWith('assets/')) {
      return new Response('Not Found', { status: 404 });
  }

  const r2Key = key.replace('assets/', '');
  const object = await env.R2_ASSETS.get(r2Key);

  if (object === null) {
      // Fallback logic could go here, e.g. try default image
      // For now, 404
      return new Response('Asset Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  if (key.endsWith('.png')) headers.set('Content-Type', 'image/png');
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');

  return new Response(object.body, {
    headers,
  });
}

export async function handleUserImageRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.pathname.replace('/user-images/', '');

  const object = await env.R2_IMAGES.get(key);

  if (object === null) {
      return new Response('Image Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=604800, immutable');

  if (key.endsWith('.png')) headers.set('Content-Type', 'image/png');
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');

  return new Response(object.body, {
    headers,
  });
}
