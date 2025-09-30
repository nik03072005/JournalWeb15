// Simple CORS helper
export const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

export function getOriginAllowed(origin) {
  if (!origin) return '*';
  if (allowedOrigins.length === 0) return '*';
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

export function withCORS(nextResponse, origin) {
  const allowOrigin = getOriginAllowed(origin);
  nextResponse.headers.set('Access-Control-Allow-Origin', allowOrigin);
  nextResponse.headers.set('Vary', 'Origin');
  nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return nextResponse;
}

export function preflight(origin) {
  const res = new Response(null, { status: 204 });
  return withCORS(res, origin);
}
