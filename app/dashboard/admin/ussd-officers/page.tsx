/**
 * USSD Officer Management Admin Page
 *
 * Features:
 * - View all officers with USSD registration status
 * - Enable/disable USSD access per officer
 * - View USSD query logs (filterable)
 * - View usage statistics
 * - Reset Quick PINs
 *
 * Permissions: SuperAdmin, Admin only
 *
 * STATUS: Phase 7 - Not yet implemented
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "USSD Officer Management | CRMS",
  description: "Manage USSD access for field officers",
};

export default async function USSDOfficersPage() {
  // Authentication check
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Permission check: Only SuperAdmin and Admin can access
  if (
    !hasPermission(session as any, "officers", "update", "national") &&
    !hasPermission(session as any, "officers", "update", "station")
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            USSD Functionality Not Yet Implemented
          </h1>
          <p className="text-gray-600 mb-4">
            This feature is part of Phase 7 (USSD Integration) and is currently under development.
          </p>
          <p className="text-sm text-gray-500">
            USSD Officer Management will allow administrators to manage field officer access
            to the system via USSD (Unstructured Supplementary Service Data) for low-connectivity scenarios.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
