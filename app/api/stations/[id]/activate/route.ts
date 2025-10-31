/**
 * Station Activate API Route
 *
 * POST /api/stations/[id]/activate - Activate station
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageStations)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageStations } from "@/lib/permissions";
import { ValidationError, NotFoundError } from "@/src/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageStations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const station = await container.stationService.activateStation(
      id,
      session.user.id,
      ip
    );

    return NextResponse.json({
      station,
      message: "Station activated successfully",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/stations/${id}/activate error:`, error);

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
