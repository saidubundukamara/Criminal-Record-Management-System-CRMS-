/**
 * Station Performance Analytics API
 *
 * GET /api/analytics/station-performance
 * - Returns performance metrics for a specific station
 * - Includes trends, resource utilization, and comparative metrics
 * - Scope: Station+ (user's station or national for all stations)
 *
 * RBAC: Station commanders can view own station, Regional/National can view any
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

    // Permission check: Must have station+ level access
    if (!hasPermission(session, "reports", "read", "station")) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Insufficient permissions to view station performance",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId") || session.user.stationId;

    // Permission-based station access check
    if (stationId !== session.user.stationId) {
      // Requesting different station than own
      if (!hasPermission(session, "reports", "read", "national")) {
        return NextResponse.json(
          {
            error:
              "Forbidden: You can only view your own station's performance metrics",
          },
          { status: 403 }
        );
      }
    }

    // Validate station ID
    if (!stationId) {
      return NextResponse.json(
        { error: "Station ID required" },
        { status: 400 }
      );
    }

    // Get analytics from service
    const analytics = container.analyticsService;
    const metrics = await analytics.getStationPerformanceMetrics(stationId);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "analytics",
      entityId: "station-performance",
      action: "read",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        targetStationId: stationId,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error: any) {
    console.error("Station performance analytics error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "analytics",
        entityId: "station-performance",
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
      { error: "Failed to fetch station performance metrics" },
      { status: 500 }
    );
  }
}
