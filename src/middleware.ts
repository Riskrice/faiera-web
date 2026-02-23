import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/student', '/teacher'];
// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/register'];

// Role-based route access mapping
const roleRouteAccess: Record<string, string[]> = {
    admin: ['/dashboard'],
    super_admin: ['/dashboard'],
    teacher: ['/teacher', '/dashboard/courses'],
    student: ['/student'],
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for session cookie/token
    const sessionToken = request.cookies.get('faiera_session')?.value;
    const userRole = request.cookies.get('faiera_role')?.value;
    const isAuthenticated = !!sessionToken;

    // Check if accessing protected route without auth
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection
    if (isProtectedRoute && isAuthenticated && userRole) {
        const allowedPrefixes = roleRouteAccess[userRole] || [];
        const hasAccess = allowedPrefixes.some(prefix => pathname.startsWith(prefix));

        if (!hasAccess) {
            // Redirect to user's proper dashboard
            if (userRole === 'admin' || userRole === 'super_admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            } else if (userRole === 'teacher') {
                return NextResponse.redirect(new URL('/teacher', request.url));
            } else {
                return NextResponse.redirect(new URL('/student', request.url));
            }
        }
    }

    // Check if accessing auth routes while logged in
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    if (isAuthRoute && isAuthenticated) {
        if (userRole === 'admin' || userRole === 'super_admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else if (userRole === 'teacher') {
            return NextResponse.redirect(new URL('/teacher', request.url));
        } else if (userRole === 'student') {
            return NextResponse.redirect(new URL('/student', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/student/:path*',
        '/teacher/:path*',
        '/login',
        '/register',
    ],
};
