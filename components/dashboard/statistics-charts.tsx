/**
 * Statistics Charts Component
 *
 * Visual charts for case, person, and evidence statistics
 * Pan-African Design: Simple, accessible data visualization
 */
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatisticsChartsProps {
  statistics: {
    cases: {
      byStatus: Record<string, number>;
      bySeverity: Record<string, number>;
      recent: Array<{
        id: string;
        caseNumber: string;
        title: string;
        status: string;
        severity: string;
        createdAt: string;
      }>;
    };
    persons: {
      total: number;
      wanted: number;
      highRisk: number;
      withBiometrics: number;
    };
    evidence: {
      byStatus: Record<string, number>;
      sealed: number;
      digital: number;
      inCourt: number;
    };
  };
}

export function StatisticsCharts({ statistics }: StatisticsChartsProps) {
  const { cases, persons, evidence } = statistics;

  // Status colors
  const statusColors: Record<string, string> = {
    open: "bg-blue-500",
    investigating: "bg-yellow-500",
    charged: "bg-orange-500",
    court: "bg-purple-500",
    closed: "bg-gray-500",
    collected: "bg-blue-500",
    stored: "bg-green-500",
    analyzed: "bg-purple-500",
    returned: "bg-gray-500",
    destroyed: "bg-red-500",
  };

  // Severity colors
  const severityColors: Record<string, string> = {
    minor: "bg-green-500",
    major: "bg-yellow-500",
    critical: "bg-red-500",
  };

  // Calculate total for percentages
  const totalCasesByStatus = Object.values(cases.byStatus).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalCasesBySeverity = Object.values(cases.bySeverity).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalEvidenceByStatus = evidence.byStatus
    ? Object.values(evidence.byStatus).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cases by Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cases by Status
        </h3>
        <div className="space-y-3">
          {Object.entries(cases.byStatus).map(([status, count]) => {
            const percentage = totalCasesByStatus
              ? Math.round((count / totalCasesByStatus) * 100)
              : 0;
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      statusColors[status] || "bg-gray-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(cases.byStatus).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No case data available
            </p>
          )}
        </div>
      </Card>

      {/* Cases by Severity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cases by Severity
        </h3>
        <div className="space-y-3">
          {Object.entries(cases.bySeverity).map(([severity, count]) => {
            const percentage = totalCasesBySeverity
              ? Math.round((count / totalCasesBySeverity) * 100)
              : 0;
            return (
              <div key={severity}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {severity}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      severityColors[severity] || "bg-gray-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(cases.bySeverity).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No severity data available
            </p>
          )}
        </div>
      </Card>

      {/* Person Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Person Records Overview
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-700">
              Total Records
            </span>
            <span className="text-sm font-bold text-gray-900">
              {persons.total}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-700">
              Wanted Persons
            </span>
            <Badge variant="destructive">{persons.wanted}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-700">
              High Risk
            </span>
            <Badge variant="destructive">{persons.highRisk}</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">
              With Biometrics
            </span>
            <Badge variant="secondary">{persons.withBiometrics}</Badge>
          </div>
        </div>
      </Card>

      {/* Evidence by Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Evidence by Status
        </h3>
        <div className="space-y-3">
          {evidence.byStatus && Object.entries(evidence.byStatus).map(([status, count]) => {
            const percentage = totalEvidenceByStatus
              ? Math.round((count / totalEvidenceByStatus) * 100)
              : 0;
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      statusColors[status] || "bg-gray-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {(!evidence.byStatus || Object.keys(evidence.byStatus).length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">
              No evidence data available
            </p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-600">Sealed Evidence</span>
            <Badge variant="secondary">{evidence.sealed || 0}</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-600">Digital Evidence</span>
            <Badge variant="secondary">{evidence.digital || 0}</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-600">In Court</span>
            <Badge variant="secondary">{evidence.inCourt || 0}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
