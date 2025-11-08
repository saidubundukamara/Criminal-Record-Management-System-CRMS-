/**
 * USSD Officer Reset PIN API
 *
 * POST /api/ussd-officers/[id]/reset-pin
 * Reset an officer's Quick PIN (generates new random PIN)
 *
 * Permissions: SuperAdmin, Admin only
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resetQuickPin } from "@/lib/ussd-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/ussd-officers/[id]/reset-pin
 *
 * Reset officer's Quick PIN and return new PIN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check (SuperAdmin or Admin only)
    const admin = await prisma.officer.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!admin || (admin.role.level !== 1 && admin.role.level !== 2)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: officerId } = await params;

    // Reset Quick PIN
    const result = await resetQuickPin(officerId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get officer details for response
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: {
        badge: true,
        name: true,
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        entityType: "officer",
        entityId: officerId,
        officerId: session.user.id,
        action: "update",
        details: {
          field: "ussdQuickPinHash",
          action: "reset_quick_pin",
          targetOfficer: officer?.badge,
        },
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      quickPin: result.quickPin,
      officer: {
        badge: officer?.badge,
        name: officer?.name,
      },
      message: `Quick PIN reset for ${officer?.name}. New PIN: ${result.quickPin}`,
    });
  } catch (error) {
    console.error("[USSD Reset PIN Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
