/**
 * Vehicles Export API Route
 *
 * GET /api/vehicles/export - Export vehicle records to CSV
 *
 * Query parameters:
 * - stationId: Filter by station
 * - status: Filter by status (registered, stolen, impounded, recovered)
 * - vehicleType: Filter by type
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
        { error: "Forbidden: Insufficient permissions to export vehicle records" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId");
    const status = searchParams.get("status");
    const vehicleType = searchParams.get("vehicleType");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build filters
    const filters: any = {};

    if (status) filters.status = status;
    if (vehicleType) filters.vehicleType = vehicleType;
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
          { error: "Forbidden: You can only export vehicles from your own station" },
          { status: 403 }
        );
      }
    } else {
      if (!hasPermission(session, "reports", "export", "national")) {
        filters.stationId = session.user.stationId;
      }
    }

    // Fetch vehicles
    const vehicleRepo = container.vehicleRepository;
    const result = await vehicleRepo.search(filters, { limit: 10000 }); // High limit for export
    const vehicles = result.vehicles;

    // Transform to CSV-friendly format
    const csvData = vehicles.map((v: any) => ({
      "Vehicle ID": v.id,
      "License Plate": v.licensePlate,
      Make: v.make,
      Model: v.model,
      Year: v.year,
      Color: v.color,
      VIN: v.vin || "N/A",
      "Vehicle Type": v.vehicleType,
      Status: v.status,
      "Owner Name": v.ownerName,
      "Owner NIN": v.ownerNIN,
      "Owner Phone": v.ownerPhone || "N/A",
      "Owner Address": v.ownerAddress || "N/A",
      "Station ID": v.stationId,
      "Stolen At": v.stolenAt ? v.stolenAt.toISOString() : "N/A",
      "Recovered At": v.recoveredAt ? v.recoveredAt.toISOString() : "N/A",
      Notes: v.notes || "N/A",
      "Created At": v.createdAt.toISOString(),
      "Updated At": v.updatedAt.toISOString(),
    }));

    // Generate CSV
    const csv = unparse(csvData);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "vehicle",
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
        "Content-Disposition": `attachment; filename="vehicles-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Vehicles export error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "vehicle",
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
      { error: "Failed to export vehicle records" },
      { status: 500 }
    );
  }
}
