import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/jwt';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('token')?.value;
  let role = null;

  if (authToken) {
    const result = verifyToken(authToken);
    if (result.valid) {
      role = String(result.decoded?.role || '').toLowerCase();
    }
  }

  const candidateRoute = pathname.startsWith('/candidate');
  const coachRoute = pathname.startsWith('/coach');

  if ((candidateRoute || coachRoute) && !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (candidateRoute && role !== 'candidate') {
    return NextResponse.redirect(new URL('/coach/dashboard', request.url));
  }

  if (coachRoute && role !== 'coach') {
    return NextResponse.redirect(new URL('/candidate/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
