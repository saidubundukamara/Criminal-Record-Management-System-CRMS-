/**
 * Audit Log Statistics API Route
 *
 * GET /api/audit/stats - Get audit log statistics
 *
 * CRMS - Pan-African Digital Public Good
 * Admin-only endpoint for viewing audit log statistics
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/audit/stats
 *
 * Get comprehensive audit log statistics
 *
 * Returns:
 * {
 *   totalLogs: number,
 *   successRate: number,
 *   failedOperations: number,
 *   logsByAction: { action: string, count: number }[],
 *   logsByEntityType: { entityType: string, count: number }[],
 *   mostActiveOfficers: { officerId: string, officerName: string, count: number }[],
 *   recentActivity: { period: string, count: number }[]
 * }
 *
 * Requires: Admin or SuperAdmin role
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorization check (Admin or SuperAdmin only)
    if (!hasPermission(session, "reports", "read", "national")) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required to view audit statistics" },
        { status: 403 }
      );
    }

    // 3. Calculate statistics
    // Total logs
    const totalLogs = await container.auditLogRepository.count();

    // Success vs failure counts
    const successfulLogs = await container.auditLogRepository.count({
      success: true,
    });
    const failedLogs = await container.auditLogRepository.count({
      success: false,
    });
    const successRate =
      totalLogs > 0 ? ((successfulLogs / totalLogs) * 100).toFixed(2) : "0.00";

    // Fetch all logs for aggregation (last 1000 for performance)
    const allLogs = await container.auditLogRepository.findAll(undefined, 1000);

    // Logs by action
    const logsByAction = Object.entries(
      allLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 actions

    // Logs by entity type
    const logsByEntityType = Object.entries(
      allLogs.reduce((acc, log) => {
        acc[log.entityType] = (acc[log.entityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([entityType, count]) => ({ entityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 entity types

    // Most active officers
    const officerCounts = allLogs.reduce((acc, log) => {
      if (log.officerId) {
        acc[log.officerId] = (acc[log.officerId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostActiveOfficers = await Promise.all(
      Object.entries(officerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Top 10 officers
        .map(async ([officerId, count]) => {
          const officer = await container.officerRepository.findById(officerId);
          return {
            officerId,
            officerName: officer ? officer.name : "Unknown Officer",
            officerBadge: officer ? officer.badge : "N/A",
            count,
          };
        })
    );

    // Recent activity (last 7 days, grouped by day)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = allLogs.filter(
      (log) => log.createdAt >= sevenDaysAgo
    );

    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = recentLogs.filter((log) => {
        const logDate = log.createdAt.toISOString().split("T")[0];
        return logDate === dateStr;
      }).length;

      return {
        period: dateStr,
        count,
      };
    }).reverse();

    // 4. Failed operations breakdown
    const failedLogsArray = allLogs.filter((log) => !log.success);
    const failedByAction = Object.entries(
      failedLogsArray.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. Log this stats access
    await container.auditService.logAction({
      entityType: "audit_log",
      officerId: session.user.id,
      action: "read",
      details: {
        endpoint: "/api/audit/stats",
        totalLogs,
        successRate,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      stationId: session.user.stationId,
      success: true,
    });

    // 6. Return statistics
    return NextResponse.json({
      totalLogs,
      successfulLogs,
      failedOperations: failedLogs,
      successRate: parseFloat(successRate),
      logsByAction,
      logsByEntityType,
      mostActiveOfficers,
      recentActivity,
      failedByAction,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch audit statistics:", error);

    // Log the failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditService.logAction({
        entityType: "audit_log",
        officerId: session.user.id,
        action: "read",
        details: {
          endpoint: "/api/audit/stats",
          error: error instanceof Error ? error.message : "Unknown error"
        },
        success: false,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch audit statistics" },
      { status: 500 }
    );
  }
}
