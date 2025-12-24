// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
    '/login',
    '/register',
    '/register/company',
    '/register/user',
    '/forgot-password',
    '/reset-password',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = [
    '/login',
    '/register',
    '/register/company',
    '/register/user',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth token in cookies or from local/session storage (via header)
    // Note: We can only access cookies in middleware, not localStorage
    // The token check happens client-side via zustand, this is a basic protection layer
    const authToken = request.cookies.get('authToken')?.value;

    // Check if the path is public
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // If user is on auth route and has token, redirect to dashboard
    // Note: Full auth validation happens client-side
    if (isAuthRoute && authToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If accessing protected route without basic auth indicator
    // The actual auth check is done client-side with zustand
    if (!isPublicRoute && pathname !== '/' && !pathname.startsWith('/api')) {
        // We allow the request to continue - client-side will handle auth
        // This is because localStorage is not accessible in middleware
        return NextResponse.next();
    }

    // Redirect root to dashboard or login based on auth
    if (pathname === '/') {
        if (authToken) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};