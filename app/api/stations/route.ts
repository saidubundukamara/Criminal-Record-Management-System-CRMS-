/**
 * Stations API Routes
 *
 * Endpoints:
 * GET /api/stations - List stations with filters
 * POST /api/stations - Create new station
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageStations)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageStations } from "@/lib/permissions";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";

/**
 * GET /api/stations
 * List stations with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - Admin only
    if (!canManageStations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const region = searchParams.get("region");
    const district = searchParams.get("district");
    const search = searchParams.get("search");

    // Build filters
    const filters: any = {};

    if (active !== null) filters.active = active === "true";
    if (region) filters.region = region;
    if (district) filters.district = district;
    if (search) filters.search = search;

    // Get stations
    const stations = await container.stationService.listStations(filters);

    // Get stats
    const stats = await container.stationService.getStats(
      region ? { region } : undefined
    );

    return NextResponse.json({
      stations,
      stats,
      count: stations.length,
    });
  } catch (error) {
    console.error("GET /api/stations error:", error);

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
 * POST /api/stations
 * Create a new station
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - Admin only
    if (!canManageStations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Create station
    const newStation = await container.stationService.createStation(
      {
        name: body.name,
        code: body.code,
        location: body.location,
        district: body.district,
        region: body.region,
        phone: body.phone,
        email: body.email,
        latitude: body.latitude,
        longitude: body.longitude,
      },
      session.user.id,
      ip
    );

    return NextResponse.json({ station: newStation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/stations error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
