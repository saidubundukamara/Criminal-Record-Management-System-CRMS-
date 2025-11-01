"use client";

/**
 * Dashboard Sidebar
 *
 * Navigation sidebar with role-based menu items.
 * Shows different navigation options based on user permissions.
 *
 * Pan-African Design: Accessible, responsive navigation
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import {
  hasPermission,
  isAdmin,
  isSuperAdmin,
} from "@/lib/permissions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  requiredRole?: "admin" | "superadmin";
}

interface DashboardSidebarProps {
  session: Session;
}

export default function DashboardSidebar({ session }: DashboardSidebarProps) {
  const pathname = usePathname();

  // Navigation items with permission checks
  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Cases",
      href: "/dashboard/cases",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      requiredPermission: { resource: "cases", action: "read" },
    },
    {
      name: "Persons",
      href: "/dashboard/persons",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      requiredPermission: { resource: "persons", action: "read" },
    },
    {
      name: "Evidence",
      href: "/dashboard/evidence",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      requiredPermission: { resource: "evidence", action: "read" },
    },
    {
      name: "Alerts",
      href: "/dashboard/alerts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      requiredPermission: { resource: "alerts", action: "read" },
    },
    {
      name: "Background Checks",
      href: "/dashboard/background-checks",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      requiredPermission: { resource: "bgcheck", action: "read" },
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      requiredPermission: { resource: "reports", action: "read" },
    },
    {
      name: "Officers",
      href: "/dashboard/admin/officers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      requiredPermission: { resource: "officers", action: "read" },
    },
    {
      name: "Stations",
      href: "/dashboard/admin/stations",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      requiredRole: "admin",
    },
    {
      name: "Roles",
      href: "/dashboard/admin/roles",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      requiredRole: "superadmin",
    },
    {
      name: "Vehicles",
      href: "/dashboard/admin/vehicles",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      requiredPermission: { resource: "reports", action: "read" },
    },
    {
      name: "USSD Officers",
      href: "/dashboard/admin/ussd-officers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      requiredPermission: { resource: "officers", action: "read" },
    },
  ];

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter((item) => {
    // Check role-based access
    if (item.requiredRole === "superadmin" && !isSuperAdmin(session)) {
      return false;
    }
    if (item.requiredRole === "admin" && !isAdmin(session)) {
      return false;
    }

    // Check permission-based access
    if (item.requiredPermission) {
      return hasPermission(
        session,
        item.requiredPermission.resource as any,
        item.requiredPermission.action as any,
        "own"
      );
    }

    return true;
  });

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-blue-700 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 py-5 bg-blue-800">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-700"
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
            <div className="ml-3">
              <h1 className="text-white font-bold text-lg">CRMS</h1>
              <p className="text-blue-200 text-xs">Law Enforcement</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                  isActive
                    ? "bg-blue-800 text-white"
                    : "text-blue-100 hover:bg-blue-600 hover:text-white"
                }`}
              >
                <span className={isActive ? "text-white" : "text-blue-300 group-hover:text-white"}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 bg-blue-800 px-4 py-3">
          <p className="text-xs text-blue-300 text-center">
            {session.user.stationName}
          </p>
          <p className="text-xs text-blue-400 text-center mt-1">
            {session.user.stationCode}
          </p>
        </div>
      </div>
    </div>
  );
}
