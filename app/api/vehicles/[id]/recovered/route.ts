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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vehicle = await container.vehicleService.markAsRecovered(id, undefined, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Vehicle marked as recovered",
      vehicle,
    });
  } catch (error: any) {
    console.error("[Mark Recovered Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
