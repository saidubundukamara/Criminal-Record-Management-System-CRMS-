/**
 * USSD Officer Detail API Routes
 *
 * Endpoints:
 * GET /api/ussd-officers/[id] - Get officer USSD details
 * PATCH /api/ussd-officers/[id] - Update USSD settings
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageOfficers)
 *
 * STATUS: Phase 7 - Not yet implemented
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/ussd-officers/[id]
 * Get officer USSD details with query statistics
 *
 * TODO: Implement in Phase 7 (USSD Integration)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Phase 7 - Not yet implemented
  return NextResponse.json(
    { error: "USSD functionality not yet implemented (Phase 7)" },
    { status: 501 }
  );
}

/**
 * PATCH /api/ussd-officers/[id]
 * Update officer USSD settings
 *
 * TODO: Implement in Phase 7 (USSD Integration)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Phase 7 - Not yet implemented
  return NextResponse.json(
    { error: "USSD functionality not yet implemented (Phase 7)" },
    { status: 501 }
  );
}
