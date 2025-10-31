/**
 * Audit Log Export API Route
 *
 * GET /api/audit/export - Export audit logs to CSV
 *
 * CRMS - Pan-African Digital Public Good
 * Admin-only endpoint for exporting audit logs
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { AuditLogFilters } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { unparse } from "papaparse";

/**
 * GET /api/audit/export
 *
 * Export audit logs to CSV file
 *
 * Query parameters:
 * - exportType: "filtered" or "all" (default: "filtered")
 * - entityType: Filter by entity type
 * - entityId: Filter by specific entity ID
 * - officerId: Filter by officer who performed the action
 * - action: Filter by action type
 * - success: Filter by success status (true/false)
 * - fromDate: Filter by start date (ISO 8601)
 * - toDate: Filter by end date (ISO 8601)
 *
 * Returns: CSV file download
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

    // 2. Rate limiting (prevent export abuse)
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");
    const rateLimitResult = await checkRateLimit({
      identifier: session.user.id,
      ...RATE_LIMITS.EXPORT
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many export requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter || 60),
          },
        }
      );
    }

    // 3. Authorization check (Admin or SuperAdmin only)
    if (!hasPermission(session, "reports", "export", "national")) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required to export audit logs" },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const exportType = searchParams.get("exportType") || "filtered";

    // Build filters (only if filtered export)
    const filters: AuditLogFilters = {};

    if (exportType === "filtered") {
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
    }

    // 4. Fetch audit logs
    // For "all" export, fetch without filters and with high limit
    const limit = exportType === "all" ? 10000 : 5000; // Safety limits
    const logs = await container.auditLogRepository.findAll(
      exportType === "filtered" ? filters : undefined,
      limit
    );

    // 5. Enrich logs with officer names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let officerName = "System";
        let officerBadge = "N/A";

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
          id: log.id,
          timestamp: log.createdAt.toISOString(),
          entityType: log.entityType,
          entityId: log.entityId || "N/A",
          officerName,
          officerBadge,
          action: log.action,
          success: log.success ? "Success" : "Failed",
          ipAddress: log.ipAddress || "N/A",
          stationId: log.stationId || "N/A",
          details: JSON.stringify(log.details),
        };
      })
    );

    // 6. Convert to CSV
    const csv = unparse(enrichedLogs, {
      columns: [
        "id",
        "timestamp",
        "entityType",
        "entityId",
        "officerName",
        "officerBadge",
        "action",
        "success",
        "ipAddress",
        "stationId",
        "details",
      ],
      header: true,
    });

    // 7. Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `audit-logs-${exportType}-${timestamp}.csv`;

    // 8. Log this export action
    await container.auditService.logAction({
      entityType: "audit_log",
      officerId: session.user.id,
      action: "export",
      details: {
        exportType,
        filters: exportType === "filtered" ? filters : "all",
        recordCount: logs.length,
        filename,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      stationId: session.user.stationId,
      success: true,
    });

    // 9. Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Failed to export audit logs:", error);

    // Log the failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditService.logAction({
        entityType: "audit_log",
        officerId: session.user.id,
        action: "export",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        success: false,
      });
    }

    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
