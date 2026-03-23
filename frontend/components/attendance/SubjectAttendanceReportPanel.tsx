"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type SchoolClass = { id: number; class_name?: string; name?: string };

type ReportRow = {
  student_id: number;
  name: string;
  admission_no: string;
  present: number;
  late: number;
  absent: number;
  half_day: number;
  holiday: number;
  days: Record<number, string>;
};

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function buttonStyle() {
  return { height: 36, padding: "0 12px", border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", borderRadius: 8, cursor: "pointer" } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

export default function SubjectAttendanceReportPanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [days, setDays] = useState(0);
  const [printUrl, setPrintUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await apiGet<{ classes: SchoolClass[] }>("/api/v1/attendance/subject-attendance/report/");
      setClasses(data.classes || []);
    };
    void load();
  }, []);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!classId || !sectionId || !month || !year) {
      setError("Class, section, month and year are required.");
      return;
    }
    try {
      setError("");
      const data = await apiPost<{ attendances: ReportRow[]; days: number; print_url: string }>(
        "/api/v1/attendance/subject-attendance/report-search/",
        {
          class: Number(classId),
          section: Number(sectionId),
          month,
          year: Number(year),
        }
      );
      setRows(data.attendances || []);
      setDays(data.days || 0);
      setPrintUrl(data.print_url || "");
    } catch {
      setError("Operation Failed");
      setRows([]);
      setDays(0);
    }
  };

  const grand = rows.reduce(
    (acc, r) => {
      acc.P += r.present;
      acc.L += r.late;
      acc.A += r.absent;
      acc.F += r.half_day;
      acc.H += r.holiday;
      return acc;
    },
    { P: 0, L: 0, A: 0, F: 0, H: 0 }
  );

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Subject Attendance Report</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span><span>/</span><span>Student Information</span><span>/</span><span>Subject Attendance Report</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <form onSubmit={search} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name || c.name || `Class ${c.id}`}</option>)}
              </select>
              <input value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="Section ID *" style={fieldStyle()} />
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={fieldStyle()}>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return <option key={m} value={m}>{m}</option>;
                })}
              </select>
              <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year *" style={fieldStyle()} />
              <button type="submit" style={buttonStyle()}>Search</button>
            </form>
            {error && <div style={{ color: "var(--warning)", marginTop: 8 }}>{error}</div>}
          </div>

          {rows.length > 0 && (
            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <strong>P:</strong> {grand.P} &nbsp; <strong>L:</strong> {grand.L} &nbsp; <strong>A:</strong> {grand.A} &nbsp; <strong>F:</strong> {grand.F} &nbsp; <strong>H:</strong> {grand.H}
                </div>
                {printUrl && <a href={`${API_BASE_URL}${printUrl}`} target="_blank" style={{ textDecoration: "none" }}><button type="button" style={buttonStyle()}>Print</button></a>}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "var(--surface-muted)", textAlign: "center" }}>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>Name</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>Admission No</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>P</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>L</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>A</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>F</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>H</th>
                      <th style={{ padding: 8, border: "1px solid var(--line)" }}>%</th>
                      {Array.from({ length: days }, (_, i) => i + 1).map((d) => <th key={d} style={{ padding: 8, border: "1px solid var(--line)" }}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const total = r.present + r.late + r.absent + r.half_day + r.holiday;
                      const percent = total > 0 ? Math.round(((r.present + r.late + r.half_day) / total) * 100) : 0;
                      return (
                        <tr key={r.student_id} style={{ textAlign: "center" }}>
                          <td style={{ padding: 8, border: "1px solid var(--line)", textAlign: "left" }}>{r.name}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)" }}>{r.admission_no}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)", color: "#16a34a" }}>{r.present}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)", color: "#d97706" }}>{r.late}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)", color: "#dc2626" }}>{r.absent}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)", color: "#2563eb" }}>{r.half_day}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)", color: "#6b7280" }}>{r.holiday}</td>
                          <td style={{ padding: 8, border: "1px solid var(--line)" }}>{percent}%</td>
                          {Array.from({ length: days }, (_, i) => i + 1).map((d) => <td key={d} style={{ padding: 8, border: "1px solid var(--line)" }}>{r.days?.[d] || ""}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
