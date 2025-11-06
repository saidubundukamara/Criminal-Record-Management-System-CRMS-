/**
 * Vehicles API Routes
 *
 * Endpoints:
 * GET /api/vehicles - List all vehicles with filters
 * POST /api/vehicles - Create new vehicle
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Officer level access
 *
 * STATUS: Phase 7 - Not yet implemented
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Vehicle functionality not yet implemented (Phase 7)" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Vehicle functionality not yet implemented (Phase 7)" },
    { status: 501 }
  );
}
