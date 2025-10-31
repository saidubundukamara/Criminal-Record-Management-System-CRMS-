/**
 * Case Trends Analytics API
 *
 * GET /api/analytics/case-trends
 * - Returns time-series case trend data
 * - Supports filtering by station and date range
 * - Scope: Station, Region, or National
 *
 * RBAC: Station+ can view, scope determines data access
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
        { error: "Forbidden: Insufficient permissions to view case trends" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Date range is REQUIRED for case trends
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Date range required. Provide 'startDate' and 'endDate' query parameters (ISO 8601 format)",
        },
        { status: 400 }
      );
    }

    // Build date range filter
    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    // Validate dates
    if (isNaN(dateRange.startDate.getTime()) || isNaN(dateRange.endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Permission-based station filtering
    let filterStationId: string | undefined;

    if (stationId) {
      // If specific station requested, verify permission
      if (hasPermission(session, "reports", "read", "national")) {
        // National scope: Can view any station
        filterStationId = stationId;
      } else if (
        hasPermission(session, "reports", "read", "station") &&
        stationId === session.user.stationId
      ) {
        // Station scope: Can only view own station
        filterStationId = stationId;
      } else {
        return NextResponse.json(
          {
            error:
              "Forbidden: You do not have permission to view this station's trends",
          },
          { status: 403 }
        );
      }
    } else {
      // No station specified: Use user's station if station-level, or null for national
      if (!hasPermission(session, "reports", "read", "national")) {
        filterStationId = session.user.stationId;
      }
      // National scope with no station filter = all stations
    }

    // Get analytics from service
    const analytics = container.analyticsService;
    const metrics = await analytics.getCaseTrendsMetrics({
      stationId: filterStationId,
      dateRange,
    });

    // Audit log
    await container.auditLogRepository.create({
      entityType: "analytics",
      entityId: "case-trends",
      action: "read",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        filterStationId,
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error: any) {
    console.error("Case trends analytics error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "analytics",
        entityId: "case-trends",
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
      { error: "Failed to fetch case trends metrics" },
      { status: 500 }
    );
  }
}
