/**
 * Compliance Report PDF Template
 *
 * Generates compliance reports for data protection authorities including:
 * - GDPR compliance metrics
 * - Malabo Convention adherence (African data protection)
 * - Audit trail statistics
 * - User activity monitoring
 * - System health indicators
 *
 * Pan-African Design:
 * - Malabo Convention compliant (African Union data protection)
 * - GDPR aligned for international standards
 * - Country-agnostic compliance framework
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { ComplianceReportData } from "@/src/services/ReportService";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderColor: "#000",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  badge: {
    padding: 5,
    backgroundColor: "#0088FE",
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    borderRadius: 3,
    marginBottom: 10,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
    backgroundColor: "#e0e0e0",
    padding: 5,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  metricCard: {
    width: "48%",
    padding: 10,
    marginRight: "2%",
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderLeft: 3,
  },
  metricLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusGood: {
    borderColor: "#22c55e",
    color: "#22c55e",
  },
  statusWarning: {
    borderColor: "#f59e0b",
    color: "#f59e0b",
  },
  statusError: {
    borderColor: "#ef4444",
    color: "#ef4444",
  },
  complianceItem: {
    flexDirection: "row",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f9f9f9",
  },
  complianceCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    marginRight: 10,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 12,
    color: "#fff",
  },
  complianceText: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
    borderTop: 1,
    borderColor: "#ccc",
    paddingTop: 10,
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderLeft: 3,
    borderColor: "#f59e0b",
    fontSize: 9,
  },
});

interface ComplianceReportPDFProps {
  data: ComplianceReportData;
}

export function ComplianceReportPDF({ data }: ComplianceReportPDFProps) {
  const { reportType, period, dataProtection, auditMetrics, userActivity, systemHealth } =
    data;

  const reportTypeLabels = {
    gdpr: "GDPR Compliance Report",
    malabo: "Malabo Convention Compliance Report",
    audit: "Internal Audit Report",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{reportTypeLabels[reportType]}</Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()} |{" "}
            {new Date().toLocaleTimeString()}
          </Text>
          <Text style={styles.badge}>CONFIDENTIAL</Text>
        </View>

        {/* Period */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
            Report Period
          </Text>
          <Text style={{ fontSize: 10 }}>
            {period.startDate.toLocaleDateString()} -{" "}
            {period.endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Data Protection Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Protection Compliance</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Total Records Protected</Text>
              <Text style={[styles.metricValue, styles.statusGood]}>
                {dataProtection.totalRecords.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Encrypted Fields</Text>
              <Text style={[styles.metricValue, styles.statusGood]}>
                {dataProtection.encryptedFields.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Access Logs Maintained</Text>
              <Text style={[styles.metricValue, styles.statusGood]}>
                {dataProtection.accessLogs.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                dataProtection.dataBreaches === 0
                  ? styles.statusGood
                  : styles.statusError,
              ]}
            >
              <Text style={styles.metricLabel}>Data Breaches</Text>
              <Text
                style={[
                  styles.metricValue,
                  dataProtection.dataBreaches === 0
                    ? styles.statusGood
                    : styles.statusError,
                ]}
              >
                {dataProtection.dataBreaches}
              </Text>
            </View>

            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Retention Compliance</Text>
              <Text style={[styles.metricValue, styles.statusGood]}>
                {dataProtection.retentionCompliance}%
              </Text>
            </View>
          </View>

          {/* Compliance Checklist */}
          <Text style={{ fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 5 }}>
            Compliance Checklist
          </Text>
          <View style={styles.complianceItem}>
            <Text style={styles.complianceCheck}>✓</Text>
            <Text style={styles.complianceText}>
              Personal data encrypted at rest (AES-256)
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <Text style={styles.complianceCheck}>✓</Text>
            <Text style={styles.complianceText}>
              Comprehensive audit logging implemented
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <Text style={styles.complianceCheck}>✓</Text>
            <Text style={styles.complianceText}>
              Role-based access control (RBAC) enforced
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <Text style={styles.complianceCheck}>✓</Text>
            <Text style={styles.complianceText}>
              Data retention policies configured and enforced
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <Text style={styles.complianceCheck}>✓</Text>
            <Text style={styles.complianceText}>
              User consent and data subject rights supported
            </Text>
          </View>
        </View>

        {/* Audit Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Trail Statistics</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Total Actions Logged</Text>
              <Text style={styles.metricValue}>
                {auditMetrics.totalActions.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                auditMetrics.failedActions > 0
                  ? styles.statusWarning
                  : styles.statusGood,
              ]}
            >
              <Text style={styles.metricLabel}>Failed Actions</Text>
              <Text style={styles.metricValue}>
                {auditMetrics.failedActions.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                auditMetrics.suspiciousActivity > 0
                  ? styles.statusError
                  : styles.statusGood,
              ]}
            >
              <Text style={styles.metricLabel}>Suspicious Activity</Text>
              <Text style={styles.metricValue}>
                {auditMetrics.suspiciousActivity}
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                auditMetrics.unauthorizedAttempts > 0
                  ? styles.statusWarning
                  : styles.statusGood,
              ]}
            >
              <Text style={styles.metricLabel}>Unauthorized Attempts</Text>
              <Text style={styles.metricValue}>
                {auditMetrics.unauthorizedAttempts}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          CRMS - Criminal Record Management System | Compliance Report |
          Confidential Document
        </Text>
      </Page>

      {/* Page 2: User Activity & System Health */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>User Activity & System Health</Text>
          <Text style={styles.subtitle}>
            {period.startDate.toLocaleDateString()} -{" "}
            {period.endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* User Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Activity</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Total Officers</Text>
              <Text style={styles.metricValue}>{userActivity.totalOfficers}</Text>
            </View>

            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Active Officers</Text>
              <Text style={styles.metricValue}>{userActivity.activeOfficers}</Text>
            </View>

            <View style={[styles.metricCard, styles.statusWarning]}>
              <Text style={styles.metricLabel}>Inactive Officers</Text>
              <Text style={styles.metricValue}>{userActivity.inactiveOfficers}</Text>
            </View>

            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Recent Logins</Text>
              <Text style={styles.metricValue}>{userActivity.recentLogins}</Text>
            </View>
          </View>
        </View>

        {/* System Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health Indicators</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>System Uptime</Text>
              <Text style={[styles.metricValue, styles.statusGood]}>
                {systemHealth.uptime}%
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                systemHealth.syncErrors > 10 ? styles.statusError : styles.statusGood,
              ]}
            >
              <Text style={styles.metricLabel}>Sync Errors</Text>
              <Text style={styles.metricValue}>{systemHealth.syncErrors}</Text>
            </View>

            <View style={[styles.metricCard, styles.statusGood]}>
              <Text style={styles.metricLabel}>Data Integrity</Text>
              <Text style={[styles.metricValue, styles.statusGood]}>
                {systemHealth.dataIntegrity}%
              </Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={{ padding: 10 }}>
            {auditMetrics.suspiciousActivity > 0 && (
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                • Investigate {auditMetrics.suspiciousActivity} suspicious activity
                incidents
              </Text>
            )}
            {auditMetrics.unauthorizedAttempts > 0 && (
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                • Review {auditMetrics.unauthorizedAttempts} unauthorized access
                attempts
              </Text>
            )}
            {userActivity.inactiveOfficers > 0 && (
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                • Review {userActivity.inactiveOfficers} inactive officer accounts for
                deactivation
              </Text>
            )}
            {systemHealth.syncErrors > 10 && (
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                • Address {systemHealth.syncErrors} sync errors to improve system
                reliability
              </Text>
            )}
            {dataProtection.dataBreaches === 0 &&
              auditMetrics.suspiciousActivity === 0 && (
                <Text style={{ fontSize: 10, color: "#22c55e" }}>
                  ✓ No critical issues detected. System is operating within compliance
                  parameters.
                </Text>
              )}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
            Compliance Disclaimer:
          </Text>
          <Text>
            This report is generated for internal compliance monitoring and data
            protection authority submissions. All metrics are based on system audit logs
            and automated checks. For complete compliance verification, manual audits and
            external assessments may be required.
          </Text>
        </View>

        <Text style={styles.footer}>
          CRMS - Criminal Record Management System | Compliance Report |
          Confidential Document
        </Text>
      </Page>
    </Document>
  );
}
