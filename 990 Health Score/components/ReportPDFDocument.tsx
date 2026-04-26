"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { GRADE_COLORS, type ScoreResult } from "@/lib/scoring";

const TEAL = "#1D9E75";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 8,
    marginBottom: 16,
  },
  brand: {
    color: TEAL,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  orgLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  scoreBox: {
    padding: 24,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: "center",
  },
  scoreLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreNum: {
    color: "#FFFFFF",
    fontSize: 56,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
  },
  gradeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  pctText: {
    color: "#FFFFFF",
    fontSize: 11,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 8,
  },
  table: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
  },
  cellHead: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#374151",
  },
  cellName: { width: "40%" },
  cellValue: { width: "20%" },
  cellBench: { width: "25%" },
  cellGrade: { width: "15%", textAlign: "center" },
  recBullet: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
});

interface ReportPDFProps {
  scoreResult: ScoreResult;
  orgName?: string;
}

export function ReportPDF({ scoreResult, orgName }: ReportPDFProps) {
  const { totalScore, grade, percentile, metrics } = scoreResult;
  const gradeColor = GRADE_COLORS[grade];
  const recs = metrics.filter(
    (m) => m.grade === "C" || m.grade === "D" || m.grade === "F",
  );
  const lastRowIdx = metrics.length - 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>GivingArc</Text>
          {orgName ? <Text style={styles.orgLabel}>{orgName}</Text> : null}
        </View>

        <Text style={styles.title}>990 Health Score Report</Text>

        <View style={[styles.scoreBox, { backgroundColor: gradeColor }]}>
          <Text style={styles.scoreLabel}>YOUR 990 HEALTH SCORE</Text>
          <Text style={styles.scoreNum}>{totalScore}</Text>
          <Text style={styles.gradeText}>Grade {grade}</Text>
          <Text style={styles.pctText}>
            Better than {percentile}% of similar nonprofits
          </Text>
        </View>

        <Text style={styles.sectionHeading}>Metrics</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.cellHead, styles.cellName]}>
              Metric
            </Text>
            <Text style={[styles.tableCell, styles.cellHead, styles.cellValue]}>
              Your Value
            </Text>
            <Text style={[styles.tableCell, styles.cellHead, styles.cellBench]}>
              Benchmark
            </Text>
            <Text style={[styles.tableCell, styles.cellHead, styles.cellGrade]}>
              Grade
            </Text>
          </View>
          {metrics.map((m, i) => (
            <View
              key={m.name}
              style={[
                styles.tableRow,
                i === lastRowIdx ? styles.tableRowLast : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.cellName]}>{m.name}</Text>
              <Text style={[styles.tableCell, styles.cellValue]}>
                {m.formatted}
              </Text>
              <Text style={[styles.tableCell, styles.cellBench]}>
                {m.benchmark}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.cellGrade,
                  {
                    color: GRADE_COLORS[m.grade],
                    fontFamily: "Helvetica-Bold",
                  },
                ]}
              >
                {m.grade}
              </Text>
            </View>
          ))}
        </View>

        {recs.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Recommendations</Text>
            {recs.map((m) => (
              <Text key={m.name} style={styles.recBullet}>
                • {m.name}: {m.recommendation}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          Generated by GivingArc · givingarc.com/schedule-a-call/
        </Text>
      </Page>
    </Document>
  );
}
