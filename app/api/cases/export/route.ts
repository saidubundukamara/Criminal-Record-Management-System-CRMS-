/**
 * Cases Export API Route
 *
 * GET /api/cases/export - Export cases to CSV
 *
 * Query parameters:
 * - stationId: Filter by station
 * - status: Filter by case status
 * - category: Filter by category
 * - severity: Filter by severity
 * - fromDate: Filter by start date (ISO 8601)
 * - toDate: Filter by end date (ISO 8601)
 *
 * Returns: CSV file download
 * Requires: Station+ level permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { unparse } from "papaparse";

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check: Station+ level required
    if (!hasPermission(session, "reports", "export", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to export cases" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build filters
    const filters: any = {};

    // Apply station filter based on permissions
    if (stationId) {
      // If specific station requested, verify access
      if (hasPermission(session, "reports", "export", "national")) {
        filters.stationId = stationId;
      } else if (stationId === session.user.stationId) {
        filters.stationId = stationId;
      } else {
        return NextResponse.json(
          { error: "Forbidden: You can only export cases from your own station" },
          { status: 403 }
        );
      }
    } else {
      // No station specified: Use user's station if not national
      if (!hasPermission(session, "reports", "export", "national")) {
        filters.stationId = session.user.stationId;
      }
    }

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (severity) filters.severity = severity;
    if (fromDate) filters.createdAfter = new Date(fromDate);
    if (toDate) filters.createdBefore = new Date(toDate);

    // Fetch cases
    const caseRepo = container.caseRepository;
    const result = await caseRepo.findAll(filters);
    const cases = (result as any).items || result;

    // Transform to CSV-friendly format
    const csvData = cases.map((c: any) => ({
      "Case Number": c.caseNumber,
      Title: c.title,
      Description: c.description,
      Category: c.category,
      Severity: c.severity,
      Status: c.status,
      "Station ID": c.stationId,
      "Assigned Officer": c.assignedOfficerId || "N/A",
      "Created At": c.createdAt.toISOString(),
      "Updated At": c.updatedAt.toISOString(),
      "Closed At": c.closedAt ? c.closedAt.toISOString() : "N/A",
    }));

    // Generate CSV
    const csv = unparse(csvData);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "case",
      entityId: "export",
      action: "export",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        filters,
        recordCount: csvData.length,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="cases-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Cases export error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "case",
        entityId: "export",
        action: "export",
        officerId: session.user.id,
        stationId: session.user.stationId,
        success: false,
        details: { error: error.message },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
    }

    return NextResponse.json(
      { error: "Failed to export cases" },
      { status: 500 }
    );
  }
}
