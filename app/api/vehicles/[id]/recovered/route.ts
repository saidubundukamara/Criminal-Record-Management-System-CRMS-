/**
 * Mark Vehicle as Recovered API Route
 *
 * Endpoint:
 * POST /api/vehicles/[id]/recovered - Mark stolen vehicle as recovered
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level access
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError, ValidationError } from "@/src/lib/errors";

/**
 * POST /api/vehicles/[id]/recovered
 * Mark stolen vehicle as recovered
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

    // Parse request body for optional recoveredDate
    const body = await request.json();
    const { recoveredDate } = body;

    // Mark as recovered
    const updatedVehicle = await container.vehicleService.markAsRecovered(
      id,
      recoveredDate,
      session.user.id
    );

    return NextResponse.json({
      vehicle: updatedVehicle,
      message: "Vehicle marked as recovered",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/vehicles/${id}/recovered error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
