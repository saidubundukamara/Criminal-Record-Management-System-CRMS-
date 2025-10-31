/**
 * Audit Log API Route
 *
 * GET /api/audit - List audit logs with filters and pagination
 *
 * CRMS - Pan-African Digital Public Good
 * Admin-only endpoint for viewing system audit logs
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { AuditLogFilters } from "@/src/domain/interfaces/repositories/IAuditLogRepository";

/**
 * GET /api/audit
 *
 * List audit logs with filters and pagination
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - entityType: Filter by entity type (case, person, evidence, officer, etc.)
 * - entityId: Filter by specific entity ID
 * - officerId: Filter by officer who performed the action
 * - action: Filter by action type (create, read, update, delete, login, etc.)
 * - success: Filter by success status (true/false)
 * - fromDate: Filter by start date (ISO 8601)
 * - toDate: Filter by end date (ISO 8601)
 *
 * Returns:
 * {
 *   logs: AuditLog[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   }
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
        { error: "Forbidden: Admin access required to view audit logs" },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50"),
      100 // Max 100 per page
    );

    // Build filters
    const filters: AuditLogFilters = {};

    if (searchParams.get("entityType")) {
      filters.entityType = searchParams.get("entityType")!;
    }

    if (searchParams.get("entityId")) {
      filters.entityId = searchParams.get("entityId")!;
    }

    if (searchParams.get("officerId")) {
      filters.officerId = searchParams.get("officerId")!;
    }

    if (searchParams.get("action")) {
      filters.action = searchParams.get("action")!;
    }

    if (searchParams.get("success")) {
      filters.success = searchParams.get("success") === "true";
    }

    if (searchParams.get("fromDate")) {
      filters.fromDate = new Date(searchParams.get("fromDate")!);
    }

    if (searchParams.get("toDate")) {
      filters.toDate = new Date(searchParams.get("toDate")!);
    }

    // 4. Get total count for pagination
    const total = await container.auditLogRepository.count(filters);
    const totalPages = Math.ceil(total / limit);

    // 5. Calculate skip for pagination
    const skip = (page - 1) * limit;

    // 6. Fetch audit logs
    // Note: Current repository implementation doesn't support skip
    // We'll fetch more and slice for now, but should update repository for production
    const allLogs = await container.auditLogRepository.findAll(
      filters,
      skip + limit
    );
    const logs = allLogs.slice(skip, skip + limit);

    // 7. Enrich logs with officer names (for better UX)
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let officerName = "System";
        let officerBadge = null;

        if (log.officerId) {
          const officer = await container.officerRepository.findById(
            log.officerId
          );
          if (officer) {
            officerName = officer.name;
            officerBadge = officer.badge;
          }
        }

        return {
          ...log,
          officerName,
          officerBadge,
        };
      })
    );

    // 8. Log this audit log access (admin viewing audit logs)
    await container.auditService.logAction({
      entityType: "audit_log",
      officerId: session.user.id,
      action: "read",
      details: {
        filters,
        page,
        limit,
        resultCount: logs.length,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      stationId: session.user.stationId,
      success: true,
    });

    // 9. Return paginated results
    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);

    // Log the failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditService.logAction({
        entityType: "audit_log",
        officerId: session.user.id,
        action: "read",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        success: false,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
