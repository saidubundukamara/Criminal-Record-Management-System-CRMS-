/**
 * Background Check Detail API Routes
 *
 * Endpoints:
 * GET /api/background-checks/[id] - Get background check by ID
 *
 * Authentication: Required (NextAuth session)
 * Permissions: bgcheck:read
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
 * GET /api/background-checks/[id]
 * Get a specific background check by ID
 *
 * Permissions: Officer or Admin
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
    if (!hasPermission(session, "bgcheck", "read", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to view background checks" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get background check
    const backgroundCheck = await container.backgroundCheckService.getBackgroundCheckById(
      id,
      session.user.id
    );

    return NextResponse.json({
      backgroundCheck,
    });
  } catch (error) {
    console.error(`GET /api/background-checks/[id] error:`, error);

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
