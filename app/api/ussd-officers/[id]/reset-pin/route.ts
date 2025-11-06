/**
 * USSD Officer Reset PIN API Route
 *
 * Endpoint:
 * POST /api/ussd-officers/[id]/reset-pin - Reset officer's USSD Quick PIN
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
 * POST /api/ussd-officers/[id]/reset-pin
 * Reset officer's USSD Quick PIN to a default value
 *
 * TODO: Implement in Phase 7 (USSD Integration)
 */
export async function POST(
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
