/**
 * USSD Officer Registration API
 *
 * Allows officers to register their phone numbers for USSD access
 *
 * POST /api/ussd/register
 * Body: { badge, pin, phoneNumber }
 *
 * Process:
 * 1. Verify officer credentials (badge + 8-digit PIN)
 * 2. Check phone not already registered to another officer
 * 3. Generate random 4-digit Quick PIN
 * 4. Hash and store binding
 * 5. Auto-enable USSD access
 * 6. Return Quick PIN (shown once only)
 */

import { NextRequest, NextResponse } from "next/server";
import { registerOfficerPhone } from "@/lib/ussd-auth";

/**
 * POST /api/ussd/register
 *
 * Register officer's phone number for USSD access
 * Public endpoint (authentication via badge + PIN in request body)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { badge, pin, phoneNumber } = body;

    // Validate required fields
    if (!badge || !pin || !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: badge, pin, phoneNumber",
        },
        { status: 400 }
      );
    }

    // Validate PIN format (8 digits)
    if (!/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid PIN format. Must be 8 digits.",
        },
        { status: 400 }
      );
    }

    // Register phone
    const result = await registerOfficerPhone(badge, phoneNumber, pin);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[USSD Registration API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
