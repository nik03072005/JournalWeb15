import { NextResponse } from 'next/server';

export async function GET(req) {
  const response = NextResponse.redirect(new URL('/auth', req.url));
  const isProd = process.env.NODE_ENV === 'production';
  response.headers.set(
    'Set-Cookie',
    ['token=;', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0', isProd ? 'Secure' : null]
      .filter(Boolean)
      .join('; ')
  );
  return response;
}
