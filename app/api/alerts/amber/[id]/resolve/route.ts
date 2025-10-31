/**
 * Amber Alert Resolve API Route
 *
 * Endpoints:
 * POST /api/alerts/amber/[id]/resolve - Mark alert as resolved (child found)
 *
 * Authentication: Required (NextAuth session)
 * Permissions: alerts:update
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
 * POST /api/alerts/amber/[id]/resolve
 * Mark an Amber Alert as resolved (child found)
 *
 * Permissions: Officer or Admin
 */
export async function POST(
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
        { error: "Forbidden: Insufficient permissions to resolve alerts" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Resolve alert
    const alert = await container.alertService.resolveAmberAlert(
      id,
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      alert,
      message: "Amber Alert resolved successfully",
    });
  } catch (error) {
    console.error(`POST /api/alerts/amber/[id]/resolve error:`, error);

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
