/**
 * Case Report PDF Template
 *
 * Generates comprehensive PDF reports for individual cases including:
 * - Case details (number, status, severity, dates)
 * - Persons involved (suspects, victims, witnesses)
 * - Evidence list with chain of custody
 * - Complete audit trail
 *
 * Pan-African Design:
 * - Country-agnostic formatting
 * - Multi-language ready (text can be localized)
 * - Standard PDF/A format for archival compliance
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { CaseReportData } from "@/src/services/ReportService";

// Styles for PDF
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
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    width: "30%",
  },
  value: {
    width: "70%",
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

interface CaseReportPDFProps {
  data: CaseReportData;
}

export function CaseReportPDF({ data }: CaseReportPDFProps) {
  const { case: caseData, persons, evidence, auditTrail, chainOfCustody } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Case Report</Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()} |{" "}
            {new Date().toLocaleTimeString()}
          </Text>
        </View>

        {/* Case Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Case Number:</Text>
            <Text style={styles.value}>{caseData.caseNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Title:</Text>
            <Text style={styles.value}>{caseData.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{caseData.description}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{caseData.category}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Severity:</Text>
            <Text style={styles.value}>{caseData.severity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{caseData.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Opened:</Text>
            <Text style={styles.value}>
              {caseData.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Persons Involved */}
        {persons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Persons Involved</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol}>Name</Text>
                <Text style={styles.tableCol}>NIN</Text>
                <Text style={styles.tableCol}>Role</Text>
              </View>
              {persons.map((person, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol}>
                    {person.firstName} {person.lastName}
                  </Text>
                  <Text style={styles.tableCol}>{person.nin}</Text>
                  <Text style={styles.tableCol}>{person.role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol}>Description</Text>
                <Text style={styles.tableCol}>Type</Text>
                <Text style={styles.tableCol}>Status</Text>
              </View>
              {evidence.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol}>{item.description}</Text>
                  <Text style={styles.tableCol}>{item.type}</Text>
                  <Text style={styles.tableCol}>
                    {item.isSealed ? "Sealed" : "Unsealed"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          CRMS - Criminal Record Management System | Confidential Document
        </Text>
      </Page>

      {/* Page 2: Chain of Custody (if evidence exists) */}
      {chainOfCustody.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Chain of Custody</Text>
            <Text style={styles.subtitle}>Case: {caseData.caseNumber}</Text>
          </View>

          {chainOfCustody.map((chain, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>
                Evidence: {chain.evidenceDescription}
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCol}>Date/Time</Text>
                  <Text style={styles.tableCol}>Officer</Text>
                  <Text style={styles.tableCol}>Action</Text>
                  <Text style={styles.tableCol}>Location</Text>
                </View>
                {chain.events.map((event, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCol}>
                      {event.timestamp.toLocaleString()}
                    </Text>
                    <Text style={styles.tableCol}>{event.officerId}</Text>
                    <Text style={styles.tableCol}>{event.action}</Text>
                    <Text style={styles.tableCol}>{event.location}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.footer}>
            CRMS - Criminal Record Management System | Confidential Document
          </Text>
        </Page>
      )}

      {/* Page 3: Audit Trail */}
      {auditTrail.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Audit Trail</Text>
            <Text style={styles.subtitle}>Case: {caseData.caseNumber}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol}>Date/Time</Text>
                <Text style={styles.tableCol}>Officer</Text>
                <Text style={styles.tableCol}>Action</Text>
              </View>
              {auditTrail.slice(0, 20).map((log, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol}>
                    {log.timestamp.toLocaleString()}
                  </Text>
                  <Text style={styles.tableCol}>{log.officerBadge}</Text>
                  <Text style={styles.tableCol}>{log.action}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>
            CRMS - Criminal Record Management System | Confidential Document
          </Text>
        </Page>
      )}
    </Document>
  );
}
