import { NextResponse } from 'next/server';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

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
    const decoded = decodeJwt(authToken);
    if (decoded) {
      role = String(decoded.role || '').toLowerCase();
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
