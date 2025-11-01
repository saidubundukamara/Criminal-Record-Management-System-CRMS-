/**
 * USSD Officer Toggle API Route
 *
 * Endpoint:
 * POST /api/ussd-officers/[id]/toggle - Toggle USSD enabled status
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageOfficers)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageOfficers } from "@/lib/permissions";
import { NotFoundError } from "@/src/lib/errors";

/**
 * POST /api/ussd-officers/[id]/toggle
 * Toggle USSD enabled status (enable/disable)
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

    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = container.prismaClient;

    // Get current status
    const officer = await prisma.officer.findUnique({
      where: { id },
      select: { ussdEnabled: true, ussdPhoneNumber: true, name: true },
    });

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    // Can't enable if not registered
    if (!officer.ussdPhoneNumber && !officer.ussdEnabled) {
      return NextResponse.json(
        { error: "Officer must be registered for USSD first" },
        { status: 400 }
      );
    }

    // Toggle status
    const newStatus = !officer.ussdEnabled;

    const updatedOfficer = await prisma.officer.update({
      where: { id },
      data: { ussdEnabled: newStatus },
      select: {
        id: true,
        badge: true,
        name: true,
        ussdEnabled: true,
        ussdPhoneNumber: true,
      },
    });

    // Audit log
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    await container.auditLogRepository.create({
      entityType: "officer",
      entityId: id,
      officerId: session.user.id,
      action: "update",
      success: true,
      details: {
        ussdToggle: true,
        newStatus,
        action: newStatus ? "enabled" : "disabled",
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      officer: updatedOfficer,
      message: `USSD ${newStatus ? "enabled" : "disabled"} for ${officer.name}`,
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/ussd-officers/${id}/toggle error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
