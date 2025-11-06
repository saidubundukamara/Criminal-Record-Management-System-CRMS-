/**
 * USSD Officers Management API
 *
 * GET /api/ussd-officers
 * List all officers with their USSD registration status
 *
 * Permissions: SuperAdmin, Admin only
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ussd-officers
 *
 * List all officers with USSD status
 * Includes: phone number, enabled status, last used, query count
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check (SuperAdmin or Admin only)
    const officer = await prisma.officer.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!officer || (officer.role.level !== 1 && officer.role.level !== 2)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all officers with USSD data
    const officers = await prisma.officer.findMany({
      where: {
        ussdPhoneNumber: { not: null }, // Only officers who have registered for USSD
      },
      select: {
        id: true,
        badge: true,
        name: true,
        ussdPhoneNumber: true,
        ussdEnabled: true,
        ussdRegisteredAt: true,
        ussdLastUsed: true,
        ussdDailyLimit: true,
        station: {
          select: {
            name: true,
            code: true,
          },
        },
        role: {
          select: {
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            ussdQueryLogs: true,
          },
        },
      },
      orderBy: {
        ussdRegisteredAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      officers: officers.map((o) => ({
        id: o.id,
        badge: o.badge,
        name: o.name,
        phoneNumber: o.ussdPhoneNumber,
        enabled: o.ussdEnabled,
        registeredAt: o.ussdRegisteredAt,
        lastUsed: o.ussdLastUsed,
        dailyLimit: o.ussdDailyLimit,
        totalQueries: o._count.ussdQueryLogs,
        station: {
          name: o.station.name,
          code: o.station.code,
        },
        role: {
          name: o.role.name,
          level: o.role.level,
        },
      })),
    });
  } catch (error) {
    console.error("[USSD Officers List Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
