/**
 * NextAuth API Route
 *
 * Handles all NextAuth authentication endpoints:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/providers
 * - /api/auth/callback/credentials
 *
 * Pan-African Design: Secure authentication API for law enforcement
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
