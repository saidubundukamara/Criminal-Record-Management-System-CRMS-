/**
 * Next.js Proxy (Next.js 16)
 *
 * Security headers, session validation, and route protection
 *
 * CRMS - Pan-African Digital Public Good
 * Comprehensive security hardening for production deployment
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/api/ussd", // USSD endpoints for feature phones
  "/manifest.json",
  "/sw.js",
  "/workbox-",
  "/icons/",
  "/favicon.ico",
  "/_next",
  "/api/health", // Health check endpoint
];

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Main proxy function
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Add comprehensive security headers
  const response = NextResponse.next();

  // Security Headers (OWASP Secure Headers Project)
  const securityHeaders = {
    // Prevent clickjacking attacks
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Enable XSS protection (for older browsers)
    "X-XSS-Protection": "1; mode=block",

    // Control referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Restrict browser features and APIs
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(self), payment=()",

    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.upstash.io", // Upstash Redis
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),

    // Strict Transport Security (HTTPS only)
    // Only enable in production with HTTPS
    ...(process.env.NODE_ENV === "production" && {
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
    }),

    // DNS Prefetch Control
    "X-DNS-Prefetch-Control": "on",

    // Download Options (IE8+)
    "X-Download-Options": "noopen",

    // Permitted Cross-Domain Policies
    "X-Permitted-Cross-Domain-Policies": "none",
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 2. Skip session validation for public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // 3. Validate session for protected routes
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token and not a public route, redirect to login
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // For pages, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if token is expired
    // NextAuth tokens include 'exp' field (Unix timestamp)
    if (token.exp && typeof token.exp === "number" && Date.now() >= token.exp * 1000) {
      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401 }
        );
      }

      // For pages, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("reason", "expired");
      return NextResponse.redirect(loginUrl);
    }

    // Session is valid, proceed with request
    return response;
  } catch (error) {
    console.error("Proxy error:", error);

    // Fail securely: redirect to login on error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Proxy configuration
 * Apply proxy to all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
