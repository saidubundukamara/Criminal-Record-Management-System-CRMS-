/**
 * Statistics Overview Component
 *
 * Displays key statistics cards for the dashboard
 * Pan-African Design: Clear, at-a-glance metrics for law enforcement
 */
"use client";

import { Briefcase, Users, Package, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatisticsOverviewProps {
  statistics: {
    overview: {
      totalCases: number;
      totalPersons: number;
      totalEvidence: number;
      staleCases: number;
    };
    cases: {
      byStatus: Record<string, number>;
      bySeverity: Record<string, number>;
    };
    persons: {
      total: number;
      wanted: number;
      highRisk: number;
      withBiometrics: number;
    };
    evidence: {
      total: number;
      byStatus: Record<string, number>;
      sealed: number;
      digital: number;
      inCourt: number;
    };
  };
}

export function StatisticsOverview({ statistics }: StatisticsOverviewProps) {
  const { overview, cases, persons, evidence } = statistics;

  const activeCases =
    (cases.byStatus.open || 0) +
    (cases.byStatus.investigating || 0) +
    (cases.byStatus.charged || 0) +
    (cases.byStatus.court || 0);

  const criticalCases = cases.bySeverity.critical || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Active Cases */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Cases</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {activeCases}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {criticalCases} critical
            </p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>

      {/* Person Records */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Person Records</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {persons.total}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {persons.wanted} wanted
            </p>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </Card>

      {/* Evidence Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Evidence Items</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {evidence.total}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {evidence.sealed} sealed
            </p>
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </Card>

      {/* Stale Cases Alert */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Stale Cases</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {overview.staleCases}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              No activity in 30+ days
            </p>
          </div>
          <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
