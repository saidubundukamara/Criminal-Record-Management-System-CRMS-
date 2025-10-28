/**
 * NextAuth.js Configuration
 *
 * Custom authentication setup with Badge + PIN credentials provider.
 * Uses JWT session strategy with 15-minute expiry for security.
 *
 * Pan-African Design: Secure authentication for law enforcement across Africa
 */
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { container } from "@/src/di/container";
import { UnauthorizedError } from "@/src/lib/errors";

/**
 * Extended session user type with officer details
 */
export interface SessionUser {
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

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes (in seconds)
    updateAge: 5 * 60, // Update session every 5 minutes
  },

  // JWT configuration
  jwt: {
    maxAge: 15 * 60, // 15 minutes (in seconds)
  },

  // Custom pages
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Providers
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Badge + PIN",
      credentials: {
        badge: {
          label: "Badge Number",
          type: "text",
          placeholder: "SA-00001",
        },
        pin: {
          label: "PIN",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials?.badge || !credentials?.pin) {
          throw new Error("Badge and PIN are required");
        }

        try {
          // Extract IP address and user agent for audit logging
          const ipAddress =
            req.headers?.["x-forwarded-for"] ||
            req.headers?.["x-real-ip"] ||
            undefined;
          const userAgent = req.headers?.["user-agent"] || undefined;

          // Authenticate using AuthService
          const officer = await container.authService.authenticateOfficer(
            credentials.badge,
            credentials.pin,
            ipAddress as string | undefined,
            userAgent as string | undefined
          );

          // Get officer's role and permissions
          const roleData = await container.roleRepository.findByIdWithPermissions(
            officer.roleId
          );

          if (!roleData) {
            throw new UnauthorizedError("Officer role not found");
          }

          // Get station details
          const station = await container.stationRepository.findById(
            officer.stationId
          );

          if (!station) {
            throw new UnauthorizedError("Officer station not found");
          }

          // Return user object for JWT
          return {
            id: officer.id,
            badge: officer.badge,
            name: officer.name,
            email: officer.email,
            roleId: roleData.role.id,
            roleName: roleData.role.name,
            roleLevel: roleData.role.level,
            stationId: station.id,
            stationName: station.name,
            stationCode: station.code,
            active: officer.active,
            mfaEnabled: officer.mfaEnabled,
            permissions: roleData.permissions.map((p) => ({
              resource: p.resource,
              action: p.action,
              scope: p.scope,
            })),
          };
        } catch (error) {
          console.error("Authentication error:", error);
          // Return null to indicate authentication failure
          // NextAuth will show generic error message
          return null;
        }
      },
    }),
  ],

  // Callbacks
  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     * Store officer data in the token
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        const sessionUser = user as SessionUser;
        token.id = sessionUser.id;
        token.badge = sessionUser.badge;
        token.name = sessionUser.name;
        token.email = sessionUser.email;
        token.roleId = sessionUser.roleId;
        token.roleName = sessionUser.roleName;
        token.roleLevel = sessionUser.roleLevel;
        token.stationId = sessionUser.stationId;
        token.stationName = sessionUser.stationName;
        token.stationCode = sessionUser.stationCode;
        token.active = sessionUser.active;
        token.mfaEnabled = sessionUser.mfaEnabled;
        token.permissions = sessionUser.permissions;
      }

      // Handle session update (e.g., after role/permission change)
      if (trigger === "update" && session) {
        // Refresh user data from database
        const officer = await container.officerRepository.findById(
          token.id as string
        );

        if (officer) {
          const roleData = await container.roleRepository.findByIdWithPermissions(
            officer.roleId
          );
          const station = await container.stationRepository.findById(
            officer.stationId
          );

          if (roleData && station) {
            token.name = officer.name;
            token.email = officer.email;
            token.roleId = roleData.role.id;
            token.roleName = roleData.role.name;
            token.roleLevel = roleData.role.level;
            token.stationId = station.id;
            token.stationName = station.name;
            token.stationCode = station.code;
            token.active = officer.active;
            token.mfaEnabled = officer.mfaEnabled;
            token.permissions = roleData.permissions.map((p) => ({
              resource: p.resource,
              action: p.action,
              scope: p.scope,
            }));
          }
        }
      }

      return token;
    },

    /**
     * Session callback - runs when session is accessed
     * Expose user data to the client
     */
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          badge: token.badge as string,
          name: token.name as string,
          email: token.email as string | null,
          roleId: token.roleId as string,
          roleName: token.roleName as string,
          roleLevel: token.roleLevel as number,
          stationId: token.stationId as string,
          stationName: token.stationName as string,
          stationCode: token.stationCode as string,
          active: token.active as boolean,
          mfaEnabled: token.mfaEnabled as boolean,
          permissions: token.permissions as SessionUser["permissions"],
        };
      }

      return session;
    },
  },

  // Events for audit logging
  events: {
    async signIn({ user }) {
      // Audit log already created in AuthService
      console.log(`Officer signed in: ${user.badge}`);
    },
    async signOut({ token }) {
      // Log signout
      if (token?.id) {
        await container.auditService.logLogout(token.id as string);
      }
    },
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
};
