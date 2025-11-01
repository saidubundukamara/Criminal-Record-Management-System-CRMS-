/**
 * Vehicles API Routes
 *
 * Endpoints:
 * GET /api/vehicles - List all vehicles with filters
 * POST /api/vehicles - Create new vehicle
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level access
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import {
  ValidationError,
} from "@/src/lib/errors";

/**
 * GET /api/vehicles
 * List all vehicles with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check - requires read access to reports/evidence
    if (!hasPermission(session as any, "reports", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get("licensePlate") || undefined;
    const ownerNIN = searchParams.get("ownerNIN") || undefined;
    const ownerName = searchParams.get("ownerName") || undefined;
    const status = searchParams.get("status") || undefined;
    const vehicleType = searchParams.get("vehicleType") || undefined;
    const stationId = searchParams.get("stationId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Build filters
    const filters: any = {};
    if (licensePlate) filters.licensePlate = licensePlate;
    if (ownerNIN) filters.ownerNIN = ownerNIN;
    if (ownerName) filters.ownerName = ownerName;
    if (status) filters.status = status;
    if (vehicleType) filters.vehicleType = vehicleType;
    if (stationId) filters.stationId = stationId;

    // Search vehicles
    const result = await container.vehicleService.searchVehicles(
      filters,
      { page, limit }
    );

    // Get statistics
    const stats = await container.vehicleService.getStatistics(stationId);

    return NextResponse.json({
      vehicles: result.vehicles,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      stats,
    });
  } catch (error) {
    console.error("GET /api/vehicles error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check - requires create access
    if (!hasPermission(session as any, "reports", "create", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Register vehicle
    const newVehicle = await container.vehicleService.registerVehicle(
      {
        licensePlate: body.licensePlate,
        ownerNIN: body.ownerNIN || null,
        ownerName: body.ownerName || null,
        vehicleType: body.vehicleType,
        make: body.make || null,
        model: body.model || null,
        color: body.color || null,
        year: body.year ? parseInt(body.year) : null,
        notes: body.notes || null,
        stationId: body.stationId || session.user.stationId,
      },
      session.user.id
    );

    return NextResponse.json({ vehicle: newVehicle }, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
