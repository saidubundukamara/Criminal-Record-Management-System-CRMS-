/**
 * Officers Bulk Actions API Route
 *
 * POST /api/officers/bulk-actions - Perform bulk actions on multiple officers
 *
 * Supported actions:
 * - activate: Activate multiple officers
 * - deactivate: Deactivate multiple officers
 * - reset-pin: Reset PIN for multiple officers
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageOfficers)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageOfficers } from "@/lib/permissions";
import { ValidationError } from "@/src/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { action, officerIds } = body;

    // Validate input
    if (!action || !officerIds || !Array.isArray(officerIds)) {
      return NextResponse.json(
        { error: "Invalid request. Required: action, officerIds (array)" },
        { status: 400 }
      );
    }

    if (officerIds.length === 0) {
      return NextResponse.json(
        { error: "No officers selected" },
        { status: 400 }
      );
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    let result: { successful: string[]; failed: string[] };

    // Perform bulk action
    switch (action) {
      case "activate":
        result = await container.officerService.bulkActivate(
          { officerIds },
          session.user.id,
          ip
        );
        break;

      case "deactivate":
        result = await container.officerService.bulkDeactivate(
          { officerIds },
          session.user.id,
          ip
        );
        break;

      case "reset-pin":
        result = await container.officerService.bulkResetPins(
          { officerIds },
          session.user.id,
          ip
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}. Supported: activate, deactivate, reset-pin` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Bulk ${action} completed`,
      successful: result.successful,
      failed: result.failed,
      successCount: result.successful.length,
      failedCount: result.failed.length,
      totalCount: officerIds.length,
    });
  } catch (error) {
    console.error("POST /api/officers/bulk-actions error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
