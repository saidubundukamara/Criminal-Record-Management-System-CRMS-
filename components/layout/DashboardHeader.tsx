"use client";

/**
 * Dashboard Header
 *
 * Top header bar with user information and logout button.
 * Shows officer name, role, and provides quick actions.
 *
 * Pan-African Design: Clear, accessible header for all users
 */
import { signOut } from "next-auth/react";
import { Session } from "next-auth";

interface DashboardHeaderProps {
  session: Session;
}

export default function DashboardHeader({ session }: DashboardHeaderProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title - Can be overridden by individual pages */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h2>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-600">
                {session.user.badge} • {session.user.roleName}
              </p>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
