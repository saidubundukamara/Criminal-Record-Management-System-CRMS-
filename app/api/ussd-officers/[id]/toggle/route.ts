/**
 * USSD Officer Toggle API
 *
 * POST /api/ussd-officers/[id]/toggle
 * Enable or disable USSD access for an officer
 *
 * Permissions: SuperAdmin, Admin only
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/ussd-officers/[id]/toggle
 *
 * Toggle ussdEnabled flag for an officer
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

    // Get target officer
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: {
        id: true,
        badge: true,
        name: true,
        ussdPhoneNumber: true,
        ussdEnabled: true,
      },
    });

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    if (!officer.ussdPhoneNumber) {
      return NextResponse.json(
        { error: "Officer has not registered for USSD" },
        { status: 400 }
      );
    }

    // Toggle enabled status
    const newStatus = !officer.ussdEnabled;

    await prisma.officer.update({
      where: { id: officerId },
      data: {
        ussdEnabled: newStatus,
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
          field: "ussdEnabled",
          oldValue: officer.ussdEnabled,
          newValue: newStatus,
          targetOfficer: officer.badge,
          action: newStatus ? "enabled" : "disabled",
        },
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        ussdEnabled: newStatus,
      },
      message: `USSD access ${newStatus ? "enabled" : "disabled"} for ${officer.name}`,
    });
  } catch (error) {
    console.error("[USSD Toggle Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
