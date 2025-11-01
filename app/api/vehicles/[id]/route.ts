/**
 * Vehicle Detail API Routes
 *
 * Endpoints:
 * GET /api/vehicles/[id] - Get vehicle by ID
 * PATCH /api/vehicles/[id] - Update vehicle
 * DELETE /api/vehicles/[id] - Delete vehicle
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
  NotFoundError,
} from "@/src/lib/errors";

/**
 * GET /api/vehicles/[id]
 * Get vehicle by ID
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

    if (!hasPermission(session as any, "reports", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vehicle = await container.vehicleService.getVehicleById(
      id,
      session.user.id
    );

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    const { id } = await params;
    console.error(`GET /api/vehicles/${id} error:`, error);

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
 * PATCH /api/vehicles/[id]
 * Update vehicle
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

    if (!hasPermission(session as any, "reports", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Update vehicle
    const updatedVehicle = await container.vehicleService.updateVehicle(
      id,
      {
        ownerNIN: body.ownerNIN !== undefined ? body.ownerNIN : undefined,
        ownerName: body.ownerName !== undefined ? body.ownerName : undefined,
        vehicleType: body.vehicleType,
        make: body.make !== undefined ? body.make : undefined,
        model: body.model !== undefined ? body.model : undefined,
        color: body.color !== undefined ? body.color : undefined,
        year: body.year ? parseInt(body.year) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      session.user.id
    );

    return NextResponse.json({ vehicle: updatedVehicle });
  } catch (error) {
    const { id } = await params;
    console.error(`PATCH /api/vehicles/${id} error:`, error);

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
 * DELETE /api/vehicles/[id]
 * Delete vehicle
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

    if (!hasPermission(session as any, "reports", "delete", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Delete vehicle
    await container.vehicleService.deleteVehicle(id, session.user.id);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "vehicle",
      entityId: id,
      officerId: session.user.id,
      action: "delete",
      success: true,
      details: {},
      ipAddress: ip,
    });

    return NextResponse.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    const { id } = await params;
    console.error(`DELETE /api/vehicles/${id} error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
