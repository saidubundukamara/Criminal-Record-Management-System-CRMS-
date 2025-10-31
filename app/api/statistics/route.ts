/**
 * Statistics API Route
 *
 * GET /api/statistics - Get system-wide statistics
 *
 * Pan-African Design: Analytics for law enforcement management
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/statistics
 * Get comprehensive statistics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - need read access
    if (!hasPermission(session, "reports", "read", "own")) {
      // If no reports permission, check for cases permission
      if (!hasPermission(session, "cases", "read", "own")) {
        throw new ForbiddenError("Insufficient permissions to view statistics");
      }
    }

    const prisma = container.prismaClient;

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId") || session.user.stationId;

    // Build where clause based on permissions
    let whereClause: any = {};

    // Scope filtering based on permissions
    if (hasPermission(session, "cases", "read", "national")) {
      // National scope - no station filter
      whereClause = {};
    } else if (hasPermission(session, "cases", "read", "station")) {
      // Station scope
      whereClause = { stationId };
    } else {
      // Own scope - only cases assigned to this officer
      whereClause = { officerId: session.user.id };
    }

    // Fetch all statistics in parallel
    const [
      // Case statistics
      totalCases,
      casesByStatus,
      casesBySeverity,
      recentCases,
      staleCases,

      // Person statistics
      totalPersons,
      personsWithBiometrics,

      // Evidence statistics
      totalEvidence,
      evidenceByType,
      digitalEvidence,
      recentEvidence,

      // Activity statistics
      recentAuditLogs,
    ] = await Promise.all([
      // Cases
      prisma.case.count({ where: whereClause }),

      prisma.case.groupBy({
        by: ["status"],
        where: whereClause,
        _count: true,
      }),

      prisma.case.groupBy({
        by: ["severity"],
        where: whereClause,
        _count: true,
      }),

      prisma.case.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
          severity: true,
          createdAt: true,
        },
      }),

      prisma.case.count({
        where: {
          ...whereClause,
          updatedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          status: {
            not: "closed",
          },
        },
      }),

      // Persons (filtered by creator's station)
      prisma.person.count({
        where: {
          createdBy: { stationId }
        }
      }),

      // Persons with fingerprints/biometrics
      prisma.person.count({
        where: {
          createdBy: { stationId },
          OR: [
            { fingerprintHash: { not: null } },
            { biometricHash: { not: null } },
          ],
        },
      }),

      // Evidence (filtered by case's station)
      prisma.evidence.count({
        where: {
          case: { stationId }
        }
      }),

      // Evidence count by type (no groupBy by status - Evidence doesn't have status)
      prisma.evidence.groupBy({
        by: ["type"],
        where: {
          case: { stationId }
        },
        _count: true,
      }),

      // Digital evidence (has file)
      prisma.evidence.count({
        where: {
          case: { stationId },
          storageUrl: { not: null },
        },
      }),

      // Evidence collected in last 30 days
      prisma.evidence.count({
        where: {
          case: { stationId },
          collectedDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Activity
      prisma.auditLog.findMany({
        where: {
          stationId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          entityType: true,
          action: true,
          createdAt: true,
          officer: {
            select: {
              name: true,
              badge: true,
            },
          },
        },
      }),
    ]);

    // Transform data for frontend
    const statistics = {
      overview: {
        totalCases,
        totalPersons,
        totalEvidence,
        staleCases,
      },
      cases: {
        byStatus: casesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: casesBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recent: recentCases,
      },
      persons: {
        total: totalPersons,
        withBiometrics: personsWithBiometrics,
      },
      evidence: {
        total: totalEvidence,
        byType: evidenceByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        digital: digitalEvidence,
        recent: recentEvidence,
      },
      activity: {
        recentActions: recentAuditLogs.map((log) => ({
          id: log.id,
          entityType: log.entityType,
          action: log.action,
          officerName: log.officer?.name || "System",
          officerBadge: log.officer?.badge || null,
          timestamp: log.createdAt,
        })),
      },
    };

    return NextResponse.json({ statistics }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching statistics:", error);

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
