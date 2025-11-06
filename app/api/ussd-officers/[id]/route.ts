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
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import Prisma here since DI container isn't available in API routes yet
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const { id } = await params;

    // Get officer with USSD data
    const officer = await prisma.officer.findUnique({
      where: { id },
      include: {
        role: { select: { name: true, level: true } },
        station: { select: { name: true, code: true } },
        _count: { select: { ussdQueryLogs: true } },
      },
    });

    if (!officer) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    // Get today's query count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const queriesToday = await prisma.uSSDQueryLog.count({
      where: {
        officerId: id,
        timestamp: { gte: startOfDay },
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        ussdPhoneNumber: officer.ussdPhoneNumber,
        ussdEnabled: officer.ussdEnabled,
        ussdRegisteredAt: officer.ussdRegisteredAt,
        ussdLastUsed: officer.ussdLastUsed,
        ussdDailyLimit: officer.ussdDailyLimit,
        queriesToday,
        totalQueries: officer._count.ussdQueryLogs,
        roleName: officer.role.name,
        roleLevel: officer.role.level,
        stationName: officer.station.name,
        stationCode: officer.station.code,
      },
    });
  } catch (error) {
    console.error("[USSD Officer Detail Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ussd-officers/[id]
 * Update officer USSD settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import Prisma and helpers
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Permission check: Only SuperAdmin and Admin can update USSD settings
    const requestingOfficer = await prisma.officer.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!requestingOfficer || (requestingOfficer.role.level !== 1 && requestingOfficer.role.level !== 2)) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { ussdPhoneNumber, ussdDailyLimit } = body;

    // Validate inputs
    if (ussdPhoneNumber !== undefined && ussdPhoneNumber !== null) {
      if (typeof ussdPhoneNumber !== "string" || !/^\+?[1-9]\d{1,14}$/.test(ussdPhoneNumber)) {
        await prisma.$disconnect();
        return NextResponse.json(
          { error: "Invalid phone number format (E.164 required)" },
          { status: 400 }
        );
      }
    }

    if (ussdDailyLimit !== undefined) {
      if (typeof ussdDailyLimit !== "number" || ussdDailyLimit < 1 || ussdDailyLimit > 1000) {
        await prisma.$disconnect();
        return NextResponse.json(
          { error: "Daily limit must be between 1 and 1000" },
          { status: 400 }
        );
      }
    }

    // Update officer
    const updatedOfficer = await prisma.officer.update({
      where: { id },
      data: {
        ...(ussdPhoneNumber !== undefined && { ussdPhoneNumber }),
        ...(ussdDailyLimit !== undefined && { ussdDailyLimit }),
      },
      include: {
        role: { select: { name: true } },
        station: { select: { name: true } },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        entityType: "officer",
        entityId: id,
        action: "update",
        officerId: session.user.id,
        details: {
          field: "ussd_settings",
          changes: body,
        },
        success: true,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "USSD settings updated successfully",
      officer: {
        id: updatedOfficer.id,
        badge: updatedOfficer.badge,
        name: updatedOfficer.name,
        ussdPhoneNumber: updatedOfficer.ussdPhoneNumber,
        ussdDailyLimit: updatedOfficer.ussdDailyLimit,
      },
    });
  } catch (error: any) {
    console.error("[USSD Officer Update Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
