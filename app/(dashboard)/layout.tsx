/**
 * Dashboard Layout
 *
 * Main layout for the authenticated dashboard area.
 * Includes sidebar navigation, header with user info, and logout.
 *
 * Pan-African Design: Responsive, accessible dashboard for law enforcement
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { OfflineIndicator } from "@/components/layout/offline-indicator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is active
  if (!session.user.active) {
    redirect("/login?error=AccountInactive");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <DashboardSidebar session={session} />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <DashboardHeader session={session} />

        {/* Page Content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Offline Indicator - Floating overlay for all dashboard pages */}
      <OfflineIndicator />
    </div>
  );
}
