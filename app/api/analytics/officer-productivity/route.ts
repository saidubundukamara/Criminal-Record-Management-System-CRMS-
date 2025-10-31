/**
 * Officer Productivity Analytics API
 *
 * GET /api/analytics/officer-productivity
 * - Returns productivity metrics for officers
 * - Supports filtering by officer ID and date range
 * - Scope: Own (single officer) or Station (all officers)
 *
 * RBAC: Officers can view own metrics, Station+ can view station metrics
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const officerId = searchParams.get("officerId") || session.user.id;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Permission check: Officers can only view their own metrics
    // Station commanders and above can view any officer in their scope
    if (officerId !== session.user.id) {
      if (!hasPermission(session, "reports", "read", "station")) {
        return NextResponse.json(
          { error: "Forbidden: You can only view your own productivity metrics" },
          { status: 403 }
        );
      }
    }

    // Build date range filter if provided
    let dateRange: { startDate: Date; endDate: Date } | undefined;
    if (startDate && endDate) {
      dateRange = {
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
    }

    // Get analytics from service
    const analytics = container.analyticsService;
    const metrics = await analytics.getOfficerProductivityMetrics(
      officerId,
      dateRange
    );

    // Audit log
    await container.auditLogRepository.create({
      entityType: "analytics",
      entityId: "officer-productivity",
      action: "read",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        targetOfficerId: officerId,
        dateRange: dateRange
          ? {
              startDate: dateRange.startDate.toISOString(),
              endDate: dateRange.endDate.toISOString(),
            }
          : null,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error: any) {
    console.error("Officer productivity analytics error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "analytics",
        entityId: "officer-productivity",
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
      { error: "Failed to fetch officer productivity metrics" },
      { status: 500 }
    );
  }
}
