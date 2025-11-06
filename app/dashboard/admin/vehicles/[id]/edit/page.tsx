/**
 * Edit Vehicle Page
 *
 * Form for editing an existing vehicle record
 * Pan-African Design: Clear, accessible form for vehicle management
 *
 * STATUS: Phase 7 - Not yet implemented
 */
"use client";

import { AlertCircle } from "lucide-react";

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vehicle Management Not Yet Implemented
          </h1>
          <p className="text-gray-600 mb-4">
            This feature is part of Phase 7 (USSD & Vehicle Management) and is currently under development.
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
