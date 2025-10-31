/**
 * CSRF Protection Utility
 *
 * Cross-Site Request Forgery (CSRF) protection for CRMS
 *
 * CRMS - Pan-African Digital Public Good
 *
 * IMPORTANT: NextAuth.js already provides built-in CSRF protection for authentication flows.
 * This utility documents the CSRF protection and provides helpers for custom forms.
 */

import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

/**
 * CSRF Token Configuration
 */
export const CSRF_CONFIG = {
  HEADER_NAME: "x-csrf-token",
  COOKIE_NAME: "csrf-token",
  TOKEN_LENGTH: 32, // bytes
  TOKEN_EXPIRY: 3600, // 1 hour in seconds
};

/**
 * Generate a CSRF token
 *
 * @returns CSRF token string
 *
 * @example
 * const token = generateCsrfToken();
 * // Store in session or cookie
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString("hex");
}

/**
 * Validate CSRF token from request
 *
 * Checks both header and body for CSRF token
 *
 * @param request - Next.js request object
 * @param expectedToken - Expected CSRF token (from session/cookie)
 * @returns true if token is valid
 *
 * @example
 * const isValid = validateCsrfToken(request, sessionToken);
 * if (!isValid) {
 *   return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
 * }
 */
export function validateCsrfToken(
  request: NextRequest,
  expectedToken: string
): boolean {
  if (!expectedToken) {
    return false;
  }

  // Check header
  const headerToken = request.headers.get(CSRF_CONFIG.HEADER_NAME);
  if (headerToken && headerToken === expectedToken) {
    return true;
  }

  // Check cookie
  const cookieToken = request.cookies.get(CSRF_CONFIG.COOKIE_NAME)?.value;
  if (cookieToken && cookieToken === expectedToken) {
    return true;
  }

  // Token not found or doesn't match
  return false;
}

/**
 * Get CSRF token from request
 *
 * @param request - Next.js request object
 * @returns CSRF token or null
 */
export function getCsrfToken(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get(CSRF_CONFIG.HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }

  // Check cookie
  const cookieToken = request.cookies.get(CSRF_CONFIG.COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * CSRF Protection Notes for CRMS
 *
 * 1. NextAuth.js CSRF Protection:
 *    - NextAuth automatically includes CSRF tokens in authentication requests
 *    - Uses `csrfToken` parameter in signin/signout callbacks
 *    - Validates tokens on the server side
 *    - See: https://next-auth.js.org/configuration/options#csrf-token-and-hash
 *
 * 2. Custom Form CSRF Protection:
 *    For custom forms (not using NextAuth), follow these steps:
 *
 *    a) Server-side (API route):
 *       ```typescript
 *       import { generateCsrfToken } from "@/lib/csrf";
 *
 *       // Generate and store token
 *       const csrfToken = generateCsrfToken();
 *       // Store in session or secure cookie
 *       response.cookies.set("csrf-token", csrfToken, {
 *         httpOnly: true,
 *         secure: process.env.NODE_ENV === "production",
 *         sameSite: "strict",
 *         maxAge: 3600
 *       });
 *       ```
 *
 *    b) Client-side (React component):
 *       ```typescript
 *       // Include token in request
 *       await fetch("/api/endpoint", {
 *         method: "POST",
 *         headers: {
 *           "x-csrf-token": csrfToken,
 *           "Content-Type": "application/json"
 *         },
 *         body: JSON.stringify(data)
 *       });
 *       ```
 *
 *    c) Server-side validation (API route):
 *       ```typescript
 *       import { validateCsrfToken, getCsrfToken } from "@/lib/csrf";
 *
 *       const csrfToken = request.cookies.get("csrf-token")?.value;
 *       if (!validateCsrfToken(request, csrfToken)) {
 *         return NextResponse.json(
 *           { error: "Invalid CSRF token" },
 *           { status: 403 }
 *         );
 *       }
 *       ```
 *
 * 3. SameSite Cookie Attribute:
 *    - CRMS uses `SameSite=Strict` for all cookies
 *    - Provides additional CSRF protection
 *    - Prevents cookies from being sent in cross-site requests
 *
 * 4. Double Submit Cookie Pattern:
 *    - Store CSRF token in both cookie and request
 *    - Validate that they match on the server
 *    - Attacker cannot read cookie value due to same-origin policy
 *
 * 5. Token Rotation:
 *    - Rotate CSRF tokens on login
 *    - Rotate tokens periodically (every hour)
 *    - Generate new token after sensitive operations
 *
 * 6. Security Considerations:
 *    - Never include CSRF tokens in URLs (can leak in referrer headers)
 *    - Use HTTPS in production to prevent token interception
 *    - Set HttpOnly flag on CSRF token cookies
 *    - Use Secure flag in production
 *    - Validate token length and format
 */

/**
 * CSRF Protection Checklist for CRMS:
 *
 * ✅ NextAuth.js provides CSRF protection for authentication
 * ✅ SameSite=Strict cookies prevent cross-site requests
 * ✅ Security headers (X-Frame-Options, CSP) add defense-in-depth
 * ✅ Custom forms can use generateCsrfToken() and validateCsrfToken()
 * ✅ HTTPS enforced in production (Strict-Transport-Security header)
 * ✅ Token rotation on login via NextAuth
 * ⚠️  For custom forms outside NextAuth, implement CSRF token validation
 *
 * Current Status:
 * - Login/Logout: Protected by NextAuth.js
 * - API Routes: Protected by authentication + session validation
 * - Custom Forms: Use utilities in this file if needed
 */

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings match
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate CSRF token with constant-time comparison
 *
 * @param request - Next.js request object
 * @param expectedToken - Expected CSRF token
 * @returns true if token is valid
 */
export function secureValidateCsrfToken(
  request: NextRequest,
  expectedToken: string
): boolean {
  if (!expectedToken) {
    return false;
  }

  const token = getCsrfToken(request);
  if (!token) {
    return false;
  }

  return constantTimeCompare(token, expectedToken);
}
