/**
 * Vehicle Search API Route
 *
 * Endpoint:
 * GET /api/vehicles/search - Quick vehicle search by license plate
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level access
 * Use Case: USSD integration, field officer quick checks
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/vehicles/search
 * Quick search for vehicles by license plate
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session as any, "reports", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get("licensePlate");
    const query = searchParams.get("q"); // Alternative query param

    if (!licensePlate && !query) {
      return NextResponse.json(
        { error: "License plate or query parameter required" },
        { status: 400 }
      );
    }

    const searchTerm = licensePlate || query;

    // Search vehicles - use checkVehicle for single plate lookup
    const vehicle = await container.vehicleService.checkVehicle(
      searchTerm!,
      session.user.id
    );

    if (!vehicle) {
      return NextResponse.json(
        { found: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      vehicle: {
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        ownerName: vehicle.ownerName,
        ownerNIN: vehicle.ownerNIN,
        vehicleType: vehicle.vehicleType,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year,
        status: vehicle.status,
        stolenDate: vehicle.stolenDate,
        recoveredDate: vehicle.recoveredDate,
      },
    });
  } catch (error) {
    console.error("GET /api/vehicles/search error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
