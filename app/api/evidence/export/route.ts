/**
 * Evidence Export API Route
 *
 * GET /api/evidence/export - Export evidence records to CSV
 *
 * Query parameters:
 * - caseId: Filter by specific case
 * - stationId: Filter by station
 * - type: Filter by evidence type
 * - isSealed: Filter by sealed status
 * - inCourt: Filter by court status
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
        { error: "Forbidden: Insufficient permissions to export evidence records" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get("caseId");
    const stationId = searchParams.get("stationId");
    const type = searchParams.get("type");
    const isSealed = searchParams.get("isSealed");
    const inCourt = searchParams.get("inCourt");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build filters
    const filters: any = {};

    if (caseId) filters.caseId = caseId;
    if (type) filters.type = type;
    if (isSealed === "true") filters.isSealed = true;
    if (isSealed === "false") filters.isSealed = false;
    if (inCourt === "true") filters.inCourt = true;
    if (inCourt === "false") filters.inCourt = false;
    if (fromDate) filters.createdAfter = new Date(fromDate);
    if (toDate) filters.createdBefore = new Date(toDate);

    // Apply station filter based on permissions
    if (stationId) {
      if (hasPermission(session, "reports", "export", "national")) {
        filters.stationId = stationId;
      } else if (stationId === session.user.stationId) {
        filters.stationId = stationId;
      } else {
        return NextResponse.json(
          { error: "Forbidden: You can only export evidence from your own station" },
          { status: 403 }
        );
      }
    } else {
      if (!hasPermission(session, "reports", "export", "national")) {
        filters.stationId = session.user.stationId;
      }
    }

    // Fetch evidence
    const evidenceRepo = container.evidenceRepository;
    const result = await evidenceRepo.findAll(filters);
    const evidence = (result as any).items || result;

    // Transform to CSV-friendly format
    const csvData = evidence.map((e: any) => ({
      "Evidence ID": e.id,
      "QR Code": e.qrCode,
      "Case ID": e.caseId,
      Description: e.description,
      Type: e.type,
      "Is Sealed": e.isSealed ? "Yes" : "No",
      "Sealed By": e.sealedById || "N/A",
      "Sealed At": e.sealedAt ? e.sealedAt.toISOString() : "N/A",
      "In Court": e.inCourt ? "Yes" : "No",
      "Collected By": e.collectedById,
      Location: e.location,
      "File URL": e.fileUrl || "N/A",
      "File Hash": e.fileHash || "N/A",
      "Station ID": e.stationId,
      "Collected At": e.collectedAt.toISOString(),
      "Created At": e.createdAt.toISOString(),
      "Updated At": e.updatedAt.toISOString(),
    }));

    // Generate CSV
    const csv = unparse(csvData);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "evidence",
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
        "Content-Disposition": `attachment; filename="evidence-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Evidence export error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "evidence",
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
      { error: "Failed to export evidence records" },
      { status: 500 }
    );
  }
}
