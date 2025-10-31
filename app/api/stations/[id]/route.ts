/**
 * Station Detail API Routes
 *
 * Endpoints:
 * GET /api/stations/[id] - Get station by ID
 * PATCH /api/stations/[id] - Update station
 * DELETE /api/stations/[id] - Delete station (soft delete)
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
 * GET /api/stations/[id]
 * Get station by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!canManageStations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const station = await container.stationService.getStation(id);

    // Get officer count for this station
    const officers = await container.officerRepository.findByStationId(
      id
    );

    return NextResponse.json({
      station,
      officerCount: officers.length,
    });
  } catch (error) {
    const { id } = await params;
    console.error(`GET /api/stations/${id} error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stations/[id]
 * Update station
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!canManageStations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Update station
    const updatedStation = await container.stationService.updateStation(
      id,
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
        active: body.active,
      },
      session.user.id,
      ip
    );

    return NextResponse.json({ station: updatedStation });
  } catch (error) {
    const { id } = await params;
    console.error(`PATCH /api/stations/${id} error:`, error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stations/[id]
 * Delete station (soft delete - sets active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!canManageStations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Delete station
    await container.stationService.deleteStation(
      id,
      session.user.id,
      ip
    );

    return NextResponse.json({ message: "Station deleted successfully" });
  } catch (error) {
    const { id } = await params;
    console.error(`DELETE /api/stations/${id} error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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
