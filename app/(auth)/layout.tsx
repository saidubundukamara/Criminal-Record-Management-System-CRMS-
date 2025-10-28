/**
 * Auth Layout
 *
 * Layout for authentication pages (login, MFA, etc.)
 * Clean, centered design focused on authentication flow
 *
 * Pan-African Design: Simple, accessible authentication UI
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - CRMS",
  description: "Criminal Record Management System - Law Enforcement Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            CRMS
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Criminal Record Management System
          </p>
          <p className="text-xs text-slate-500">
            Law Enforcement Portal
          </p>
        </div>

        {/* Auth Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Secure law enforcement access only
          </p>
          <p className="text-xs text-slate-400 mt-2">
            A Pan-African Digital Public Good
          </p>
        </div>
      </div>
    </div>
  );
}
