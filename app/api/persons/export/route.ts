/**
 * Persons Export API Route
 *
 * GET /api/persons/export - Export person records to CSV
 *
 * Query parameters:
 * - isWanted: Filter wanted persons
 * - isHighRisk: Filter high-risk persons
 * - hasBiometrics: Filter by biometric data
 * - fromDate: Filter by start date (ISO 8601)
 * - toDate: Filter by end date (ISO 8601)
 *
 * Returns: CSV file download (PII is NOT included in export for security)
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
        { error: "Forbidden: Insufficient permissions to export person records" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const isWanted = searchParams.get("isWanted");
    const isHighRisk = searchParams.get("isHighRisk");
    const hasBiometrics = searchParams.get("hasBiometrics");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build filters
    const filters: any = {};

    if (isWanted === "true") filters.isWanted = true;
    if (isWanted === "false") filters.isWanted = false;
    if (isHighRisk === "true") filters.isHighRisk = true;
    if (isHighRisk === "false") filters.isHighRisk = false;
    if (hasBiometrics === "true") filters.hasBiometrics = true;
    if (hasBiometrics === "false") filters.hasBiometrics = false;
    if (fromDate) filters.createdAfter = new Date(fromDate);
    if (toDate) filters.createdBefore = new Date(toDate);

    // Fetch persons
    const personRepo = container.personRepository;
    const result = await personRepo.findAll(filters);
    const persons = (result as any).items || result;

    // Transform to CSV-friendly format
    // IMPORTANT: Do NOT include encrypted PII (addresses, phone, email)
    const csvData = persons.map((p: any) => ({
      "Person ID": p.id,
      NIN: p.nin,
      "First Name": p.firstName,
      "Middle Name": p.middleName || "N/A",
      "Last Name": p.lastName,
      "Date of Birth": p.dateOfBirth.toISOString().split("T")[0],
      Gender: p.gender,
      Nationality: p.nationality,
      "Is Wanted": p.isWanted ? "Yes" : "No",
      "Is High Risk": p.isHighRisk ? "Yes" : "No",
      "Has Biometrics": p.hasBiometrics ? "Yes" : "No",
      "Aliases": p.aliases.join("; ") || "None",
      "Created At": p.createdAt.toISOString(),
      "Updated At": p.updatedAt.toISOString(),
      // PII fields are intentionally EXCLUDED for security
    }));

    // Generate CSV
    const csv = unparse(csvData);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "person",
      entityId: "export",
      action: "export",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        filters,
        recordCount: csvData.length,
        note: "PII excluded from export",
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="persons-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Persons export error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "person",
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
      { error: "Failed to export person records" },
      { status: 500 }
    );
  }
}
