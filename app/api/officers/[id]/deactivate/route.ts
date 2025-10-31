/**
 * Officer Deactivate API Route
 *
 * POST /api/officers/[id]/deactivate - Deactivate officer account
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageOfficers)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageOfficers } from "@/lib/permissions";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";

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

    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const officer = await container.officerService.deactivateOfficer(
      id,
      session.user.id,
      ip
    );

    return NextResponse.json({
      officer,
      message: "Officer deactivated successfully",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/officers/${id}/deactivate error:`, error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
