/**
 * Mark Vehicle as Stolen API Route
 *
 * Endpoint:
 * POST /api/vehicles/[id]/stolen - Mark vehicle as stolen
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level access
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError } from "@/src/lib/errors";

/**
 * POST /api/vehicles/[id]/stolen
 * Mark vehicle as stolen
 */
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

    if (!hasPermission(session as any, "reports", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const stolenDate = body.stolenDate ? new Date(body.stolenDate) : new Date();

    // Mark as stolen
    const updatedVehicle = await container.vehicleService.reportStolen(
      {
        vehicleId: id,
        stolenDate: stolenDate.toISOString(),
        notes: body.notes,
        stationId: session.user.stationId,
        reportedBy: session.user.id,
      } as any,
      session.user.id
    );

    return NextResponse.json({
      vehicle: updatedVehicle,
      message: "Vehicle marked as stolen",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/vehicles/${id}/stolen error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
