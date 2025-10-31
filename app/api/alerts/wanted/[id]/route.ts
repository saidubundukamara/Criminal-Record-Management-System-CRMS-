/**
 * Wanted Person Detail API Routes
 *
 * Endpoints:
 * GET /api/alerts/wanted/[id] - Get wanted person by ID
 * PATCH /api/alerts/wanted/[id] - Update wanted person
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
 * GET /api/alerts/wanted/[id]
 * Get a specific Wanted Person by ID
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
        { error: "Forbidden: Insufficient permissions to view wanted persons" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get wanted person with person details
    const result = await container.alertService.getWantedPersonWithDetails(id);

    return NextResponse.json({
      wantedPerson: result.wantedPerson,
      person: result.person,
    });
  } catch (error) {
    console.error(`GET /api/alerts/wanted/[id] error:`, error);

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
 * PATCH /api/alerts/wanted/[id]
 * Update a Wanted Person
 *
 * Request body (all optional):
 * {
 *   charges?: Array<{ charge: string, category: string, severity: string }>,
 *   dangerLevel?: "low" | "medium" | "high" | "extreme",
 *   lastSeenLocation?: string | null,
 *   lastSeenDate?: string | null, // ISO date string
 *   physicalDescription?: string,
 *   photoUrl?: string | null,
 *   rewardAmount?: number | null,
 *   contactPhone?: string,
 *   isRegionalAlert?: boolean
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
        { error: "Forbidden: Insufficient permissions to update wanted persons" },
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

    // Update wanted person
    const wantedPerson = await container.alertService.updateWantedPerson(
      id,
      body,
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      wantedPerson,
    });
  } catch (error) {
    console.error(`PATCH /api/alerts/wanted/[id] error:`, error);

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
