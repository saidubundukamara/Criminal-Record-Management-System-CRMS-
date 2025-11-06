/**
 * Vehicle Impound API Route
 *
 * STATUS: Phase 7 - Not yet implemented
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Vehicle functionality not yet implemented (Phase 7)" },
    { status: 501 }
  );
}
