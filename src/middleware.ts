import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, getSessionCookieName } from '@/lib/auth';

// Routes that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if auth is configured — if not, skip auth entirely
  if (!process.env.AUTH_SECRET || !process.env.AUTH_EMAIL || !process.env.AUTH_PASSWORD) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = req.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
