/**
 * Station Performance Report PDF Template
 *
 * Generates monthly/quarterly station performance reports including:
 * - Station identification and period
 * - Key performance metrics (cases, resolution rate, etc.)
 * - Cases by category and severity
 * - Top performing officers
 *
 * Pan-African Design:
 * - Country-agnostic formatting
 * - Multi-language ready
 * - Configurable period formats
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { StationReportData } from "@/src/services/ReportService";

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
  stationInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    padding: 10,
    marginRight: "2%",
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderLeft: 3,
    borderColor: "#0088FE",
  },
  metricLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
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
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#333",
    color: "#fff",
    padding: 5,
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#ccc",
    padding: 5,
  },
  tableCol: {
    flex: 1,
    fontSize: 10,
  },
  tableColSmall: {
    flex: 0.5,
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
});

interface StationReportPDFProps {
  data: StationReportData;
}

export function StationReportPDF({ data }: StationReportPDFProps) {
  const { station, period, metrics, casesByCategory, casesBySeverity, topOfficers } =
    data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Station Performance Report</Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()} |{" "}
            {new Date().toLocaleTimeString()}
          </Text>
        </View>

        {/* Station Info */}
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>
            {station.code} - {station.name}
          </Text>
          <Text style={{ fontSize: 12, color: "#666" }}>
            Report Period: {period.label}
          </Text>
          <Text style={{ fontSize: 10, color: "#999" }}>
            {period.startDate.toLocaleDateString()} -{" "}
            {period.endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Cases</Text>
            <Text style={styles.metricValue}>{metrics.totalCases}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cases Opened</Text>
            <Text style={styles.metricValue}>{metrics.casesOpened}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cases Closed</Text>
            <Text style={styles.metricValue}>{metrics.casesClosed}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Resolution Rate</Text>
            <Text style={styles.metricValue}>{metrics.resolutionRate}%</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg Resolution Time</Text>
            <Text style={styles.metricValue}>
              {metrics.averageResolutionDays} days
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Stale Cases</Text>
            <Text style={styles.metricValue}>{metrics.staleCases}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Evidence Collected</Text>
            <Text style={styles.metricValue}>{metrics.evidenceCollected}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Alerts</Text>
            <Text style={styles.metricValue}>{metrics.activeAlerts}</Text>
          </View>
        </View>

        {/* Cases by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cases by Category</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol}>Category</Text>
              <Text style={styles.tableColSmall}>Count</Text>
              <Text style={styles.tableColSmall}>Percentage</Text>
            </View>
            {casesByCategory.map((cat, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol}>{cat.category}</Text>
                <Text style={styles.tableColSmall}>{cat.count}</Text>
                <Text style={styles.tableColSmall}>
                  {((cat.count / metrics.totalCases) * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cases by Severity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cases by Severity</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol}>Severity</Text>
              <Text style={styles.tableColSmall}>Count</Text>
              <Text style={styles.tableColSmall}>Percentage</Text>
            </View>
            {casesBySeverity.map((sev, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol}>{sev.severity}</Text>
                <Text style={styles.tableColSmall}>{sev.count}</Text>
                <Text style={styles.tableColSmall}>
                  {((sev.count / metrics.totalCases) * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          CRMS - Criminal Record Management System | {station.name} | Confidential
          Document
        </Text>
      </Page>

      {/* Page 2: Top Officers */}
      {topOfficers.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Top Performing Officers</Text>
            <Text style={styles.subtitle}>
              {station.code} - {station.name} | {period.label}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableColSmall}>Rank</Text>
                <Text style={styles.tableCol}>Badge</Text>
                <Text style={styles.tableCol}>Name</Text>
                <Text style={styles.tableColSmall}>Cases Closed</Text>
              </View>
              {topOfficers.map((officer, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableColSmall}>#{index + 1}</Text>
                  <Text style={styles.tableCol}>{officer.badge}</Text>
                  <Text style={styles.tableCol}>{officer.name}</Text>
                  <Text style={styles.tableColSmall}>{officer.casesClosed}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Summary Box */}
          <View
            style={{
              marginTop: 30,
              padding: 15,
              backgroundColor: "#f0f8ff",
              borderLeft: 3,
              borderColor: "#0088FE",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
              Performance Summary
            </Text>
            <Text style={{ fontSize: 10, marginBottom: 3 }}>
              • Total officers contributed to {metrics.totalCases} cases this period
            </Text>
            <Text style={{ fontSize: 10, marginBottom: 3 }}>
              • {metrics.casesClosed} cases successfully resolved
            </Text>
            <Text style={{ fontSize: 10, marginBottom: 3 }}>
              • Average resolution time: {metrics.averageResolutionDays} days
            </Text>
            <Text style={{ fontSize: 10 }}>
              • {metrics.staleCases} cases require attention (30+ days no activity)
            </Text>
          </View>

          <Text style={styles.footer}>
            CRMS - Criminal Record Management System | {station.name} |
            Confidential Document
          </Text>
        </Page>
      )}
    </Document>
  );
}
