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
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level (own exports) or Admin (all exports)
 *
 * STATUS: Phase 7 - Not yet implemented
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import Prisma for export (TODO: Add findAll to VehicleRepository)
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stationId = searchParams.get("stationId");

    const where: any = {};
    if (status) where.status = status;
    if (stationId) where.stationId = stationId;

    const vehicles = await prisma.vehicle.findMany({
      where,
      take: 10000,
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV
    const headers = ["License Plate", "Type", "Make", "Model", "Year", "Color", "Status", "Owner Name", "Owner NIN", "Station"];
    const rows = vehicles.map((v: any) => [
      v.licensePlate,
      v.vehicleType,
      v.make || "",
      v.model || "",
      v.year?.toString() || "",
      v.color || "",
      v.status,
      v.ownerName || "",
      v.ownerNIN || "",
      v.stationId,
    ]);

    const csv = [headers, ...rows].map((row: any) => row.join(",")).join("\n");

    await prisma.$disconnect();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="vehicles_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[Vehicle Export Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
