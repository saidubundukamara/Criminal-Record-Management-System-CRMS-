/**
 * Amber Alert Detail API Routes
 *
 * Endpoints:
 * GET /api/alerts/amber/[id] - Get amber alert by ID
 * PATCH /api/alerts/amber/[id] - Update amber alert
 *
 * Authentication: Required (NextAuth session)
 * Permissions: alerts:read, alerts:update
 *
 * CRMS - Pan-African Digital Public Good
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/alerts/amber/[id]
 * Get a specific Amber Alert by ID
 *
 * Permissions: Officer or Viewer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session, "alerts", "read", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to view alerts" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get alert
    const alert = await container.alertService.getAmberAlertById(id);

    return NextResponse.json({
      alert,
    });
  } catch (error) {
    console.error(`GET /api/alerts/amber/[id] error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts/amber/[id]
 * Update an Amber Alert
 *
 * Request body (all optional):
 * {
 *   personName?: string,
 *   age?: number | null,
 *   gender?: "male" | "female" | "unknown" | null,
 *   description?: string,
 *   photoUrl?: string | null,
 *   lastSeenLocation?: string | null,
 *   lastSeenDate?: string, // ISO date string
 *   contactPhone?: string
 * }
 *
 * Permissions: Officer or Admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session, "alerts", "update", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to update alerts" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Update alert
    const alert = await container.alertService.updateAmberAlert(
      id,
      body,
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      alert,
    });
  } catch (error) {
    console.error(`PATCH /api/alerts/amber/[id] error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
