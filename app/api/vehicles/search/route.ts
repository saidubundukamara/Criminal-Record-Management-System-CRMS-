/**
 * Vehicle Search API Route
 *
 * Endpoint:
 * GET /api/vehicles/search - Quick vehicle search by license plate
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level access
 * Use Case: USSD integration, field officer quick checks
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const result = await container.vehicleService.searchVehicles({ licensePlate: query });

    return NextResponse.json({
      success: true,
      query,
      vehicles: result.vehicles,
      count: result.total,
    });
  } catch (error: any) {
    console.error("[Vehicle Search Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
