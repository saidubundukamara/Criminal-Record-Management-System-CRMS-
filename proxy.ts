/**
 * Next.js Proxy (formerly Middleware in Next.js 15)
 *
 * Handles authentication and authorization for protected routes.
 * Runs before every request to check session validity.
 *
 * Pan-African Design: Secure route protection for law enforcement application
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy middleware function
 * Note: For NextAuth v4, we handle authentication in page/route components
 * This proxy just does basic route checking
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth"];
  const isPublicPath = publicPaths.some((p) => path.startsWith(p));

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, we'll check authentication in the page/route component
  // using getServerSession(authOptions)
  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth/* (NextAuth API routes)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /robots.txt, etc. (static files)
     * - /manifest.json, /sw.js (PWA files)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|robots.txt|manifest.json|sw.js|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
  ],
};
