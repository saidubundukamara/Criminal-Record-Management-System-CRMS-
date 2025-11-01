/**
 * USSD Officer Reset PIN API Route
 *
 * Endpoint:
 * POST /api/ussd-officers/[id]/reset-pin - Reset officer's USSD Quick PIN
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
import { hash } from "argon2";

/**
 * POST /api/ussd-officers/[id]/reset-pin
 * Reset officer's USSD Quick PIN to a default value
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

    const body = await request.json();
    const { newPin } = body;

    // Validate PIN
    if (!newPin || typeof newPin !== "string") {
      return NextResponse.json(
        { error: "New PIN is required" },
        { status: 400 }
      );
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const prisma = container.prismaClient;

    // Check officer exists
    const officer = await prisma.officer.findUnique({
      where: { id },
      select: { id: true, name: true, ussdPhoneNumber: true },
    });

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    if (!officer.ussdPhoneNumber) {
      return NextResponse.json(
        { error: "Officer is not registered for USSD" },
        { status: 400 }
      );
    }

    // Hash the new PIN
    const pinHash = await hash(newPin, {
      type: 2, // Argon2id
      memoryCost: 19456,
      timeCost: 2,
    });

    // Update officer with new PIN hash
    await prisma.officer.update({
      where: { id },
      data: { ussdQuickPinHash: pinHash },
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
        ussdPinReset: true,
        officerName: officer.name,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      message: `USSD Quick PIN reset successfully for ${officer.name}`,
      success: true,
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/ussd-officers/${id}/reset-pin error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
