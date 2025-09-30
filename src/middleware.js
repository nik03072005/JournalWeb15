// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const response = NextResponse.next();

  // Add cache headers for meta API routes
  if (request.nextUrl.pathname.startsWith('/api/meta/')) {
    // Cache for 5 minutes
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=300'
    );
    return response;
  }
  
  // Add cache headers for search pages
  if (request.nextUrl.pathname.startsWith('/search/')) {
    // Cache for 10 minutes
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=600'
    );
    return response;
  }


  // Get token from cookies or Authorization header
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');

  console.log('Token:', token);

  // Protect all admin routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard/admin');

  if (isAdminRoute) {
    // Redirect to auth if no token
    if (!token) {
      console.log('No token found, redirecting to /auth');
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    try {
      // Verify JWT
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      console.log('JWT Payload:', payload);

      // Check if user has 'admin' role
      if (payload.role !== 'admin') {
        console.log('User is not admin, redirecting to /unauthorized. Role:', payload.role);
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

     

      console.log('User is admin, allowing access');
      return NextResponse.next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Allow non-admin routes to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/admin/:path*',
    '/api/meta/:path*',
    '/search/:path*'
  ],
};