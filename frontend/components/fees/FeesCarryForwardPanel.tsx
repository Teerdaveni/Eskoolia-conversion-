"use client";

import { useEffect, useState } from "react";
import { AcademicYear, feesApi, listData } from "@/lib/fees-api";

function field() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function btn(color = "var(--primary)") {
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

export default function FeesCarryForwardPanel() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [result, setResult] = useState<{ message: string; created: number; updated: number; total_amount: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await feesApi.listAcademicYears();
        const rows = listData(data);
        setYears(rows);
        if (!fromYear && rows.length > 0) setFromYear(String(rows[0].id));
        if (!toYear && rows.length > 1) setToYear(String(rows[1].id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load academic years.");
      }
    };
    void load();
  }, []);

  const submit = async () => {
    if (!fromYear || !toYear) {
      setError("From and to academic year are required.");
      return;
    }
    try {
      setError("");
      const res = await feesApi.assignmentsCarryForward({
        from_academic_year: Number(fromYear),
        to_academic_year: Number(toYear),
        ...(dueDate ? { due_date: dueDate } : {}),
      });
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Carry forward failed.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20"><div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Fees Carry Forward</h1></div></section>
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Post Overdue Dues to Next Academic Year</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px auto", gap: 8 }}>
            <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} style={field()}>
              <option value="">From academic year</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <select value={toYear} onChange={(e) => setToYear(e.target.value)} style={field()}>
              <option value="">To academic year</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={field()} />
            <button type="button" style={btn()} onClick={() => void submit()}>Carry Forward</button>
          </div>

          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          {result && (
            <div style={{ marginTop: 10, color: "#065f46" }}>
              <p style={{ margin: "0 0 4px" }}>{result.message}</p>
              <p style={{ margin: "0 0 4px" }}>Created: {result.created}</p>
              <p style={{ margin: "0 0 4px" }}>Updated: {result.updated}</p>
              <p style={{ margin: 0 }}>Total Amount: {result.total_amount}</p>
            </div>
          )}
        </div>
      </div></section>
    </div>
  );
}
