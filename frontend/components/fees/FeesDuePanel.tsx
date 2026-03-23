"use client";

import { useEffect, useState } from "react";
import { feesApi, FeesAssignment, FeesSummary, listData } from "@/lib/fees-api";

function card() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 12 } as const;
}

export default function FeesDuePanel() {
  const [summary, setSummary] = useState<FeesSummary | null>(null);
  const [overdue, setOverdue] = useState<FeesAssignment[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, o] = await Promise.all([feesApi.assignmentsSummary(), feesApi.assignmentsOverdue()]);
      setSummary(s);
      setOverdue(listData(o));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load due report.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20"><div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Fees Due Management</h1></div></section>
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        {error && <p style={{ color: "var(--warning)", marginTop: 0 }}>{error}</p>}

        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
            <div style={card()}>Assigned<br /><strong>{summary.total_assigned}</strong></div>
            <div style={card()}>Discount<br /><strong>{summary.total_discount}</strong></div>
            <div style={card()}>Net<br /><strong>{summary.total_net}</strong></div>
            <div style={card()}>Paid<br /><strong>{summary.total_paid}</strong></div>
            <div style={card()}>Due<br /><strong>{summary.total_due}</strong></div>
            <div style={card()}>Assignments<br /><strong>{summary.count}</strong></div>
          </div>
        )}

        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Overdue Assignments</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Assignment</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Due Date</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Amount</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th></tr></thead>
            <tbody>
              {overdue.length === 0 && <tr><td colSpan={6} style={{ padding: 8, color: "var(--muted)" }}>No overdue assignments.</td></tr>}
              {overdue.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>#{row.id}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.student}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.fees_type}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.due_date}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.amount}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}
