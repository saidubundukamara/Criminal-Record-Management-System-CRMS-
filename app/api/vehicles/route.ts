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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import Prisma (TODO: Add findAll to VehicleRepository)
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stationId = searchParams.get("stationId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    if (status) where.status = status;
    if (stationId) where.stationId = stationId;

    const [vehicles, count] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: { station: { select: { name: true } } },
      }),
      prisma.vehicle.count({ where }),
    ]);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      vehicles,
      pagination: {
        limit,
        offset,
        total: count,
        hasMore: offset + limit < count,
      },
    });
  } catch (error: any) {
    console.error("[Vehicles List Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const vehicle = await container.vehicleService.registerVehicle(
      {
        ...body,
        stationId: body.stationId || (session.user as any).stationId,
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: "Vehicle created successfully",
      vehicle,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Vehicle Create Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
