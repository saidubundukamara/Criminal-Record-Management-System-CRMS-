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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vehicle = await container.vehicleRepository.findById(id);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vehicle,
    });
  } catch (error: any) {
    console.error("[Vehicle Get Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const vehicle = await container.vehicleService.updateVehicle(id, body, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error: any) {
    console.error("[Vehicle Update Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await container.vehicleService.deleteVehicle(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error: any) {
    console.error("[Vehicle Delete Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
