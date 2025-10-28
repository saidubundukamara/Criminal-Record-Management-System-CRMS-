/**
 * NextAuth Type Definitions
 *
 * Extends default NextAuth types with custom session and user types.
 * This allows TypeScript to know about our custom user fields.
 */
import "next-auth";
import "next-auth/jwt";
import { SessionUser } from "@/lib/auth";

declare module "next-auth" {
  /**
   * Extends the built-in session types
   */
  interface Session {
    user: SessionUser;
  }

  /**
   * Extends the built-in user types (returned from authorize())
   */
  interface User extends SessionUser {}
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT types
   */
  interface JWT {
    id: string;
    badge: string;
    name: string;
    email: string | null;
    roleId: string;
    roleName: string;
    roleLevel: number;
    stationId: string;
    stationName: string;
    stationCode: string;
    active: boolean;
    mfaEnabled: boolean;
    permissions: {
      resource: string;
      action: string;
      scope: string;
    }[];
  }
}
