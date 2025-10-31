/**
 * National Crime Statistics Analytics API
 *
 * GET /api/analytics/national-statistics
 * - Returns national-level crime statistics and trends
 * - Includes overview, geographic distribution, and top performers
 * - Scope: National only (SuperAdmin/Admin)
 *
 * RBAC: National scope required (SuperAdmin, Admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check: Must have NATIONAL scope
    if (!hasPermission(session, "reports", "read", "national")) {
      return NextResponse.json(
        {
          error:
            "Forbidden: National-level permissions required to view national statistics",
        },
        { status: 403 }
      );
    }

    // Get analytics from service
    const analytics = container.analyticsService;
    const statistics = await analytics.getNationalStatistics();

    // Audit log
    await container.auditLogRepository.create({
      entityType: "analytics",
      entityId: "national-statistics",
      action: "read",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        scope: "national",
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ statistics }, { status: 200 });
  } catch (error: any) {
    console.error("National statistics analytics error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "analytics",
        entityId: "national-statistics",
        action: "read",
        officerId: session.user.id,
        stationId: session.user.stationId,
        success: false,
        details: { error: error.message },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
    }

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to fetch national statistics" },
      { status: 500 }
    );
  }
}
