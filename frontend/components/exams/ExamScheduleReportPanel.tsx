"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; class_id?: number };
type ExamType = { id: number; title: string };
type Row = {
  id: number;
  exam_date: string;
  subject_name: string;
  class_name: string;
  section_name: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  room: string;
};

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) throw new Error(`GET failed ${res.status}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || body?.detail || "Operation failed");
  }
  return (await res.json()) as T;
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

function buttonStyle(color = "var(--primary)") {
  return { height: 36, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 12px", cursor: "pointer" } as const;
}

function toTimeHHMM(value: string): string {
  return (value || "").slice(0, 5);
}

export default function ExamScheduleReportPanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examTypeId, setExamTypeId] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [examName, setExamName] = useState("");
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("All Sections");

  const [error, setError] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    const id = Number(classId);
    return sections.filter((s) => s.class_id === id);
  }, [classId, sections]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{ classes: SchoolClass[]; sections: Section[]; exam_types: ExamType[] }>("/api/v1/exams/exam-schedule/index/");
        setClasses(data.classes || []);
        setSections(data.sections || []);
        setExamTypes(data.exam_types || []);
      } catch {
        setError("Failed to load criteria.");
      }
    };
    void load();
  }, []);

  const search = async () => {
    if (!classId || !examTypeId) {
      setError("Exam and class are required.");
      return;
    }

    try {
      setError("");
      const data = await apiPost<{ examName: string; class_name: string; section_name: string; exam_schedules: Row[] }>(
        "/api/v1/exams/exam-schedule/report-search/",
        {
          exam_type: Number(examTypeId),
          class: Number(classId),
          section: sectionId ? Number(sectionId) : 0,
        }
      );
      setExamName(data.examName || "");
      setClassName(data.class_name || "");
      setSectionName(data.section_name || "All Sections");
      setRows(data.exam_schedules || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No Result Found");
      setRows([]);
    }
  };

  const printReport = async () => {
    if (!classId || !examTypeId) return;
    try {
      const q = `exam_id=${examTypeId}&class_id=${classId}&section_id=${sectionId || 0}`;
      const data = await apiGet<{ exam_schedules: Row[] }>(`/api/v1/exams/exam-schedule/print/?${q}`);
      const htmlRows = (data.exam_schedules || [])
        .map(
          (r) =>
            `<tr><td>${r.exam_date}</td><td>${r.subject_name}</td><td>${r.class_name} (${r.section_name || "All"})</td><td>${r.teacher_name || "-"}</td><td>${toTimeHHMM(r.start_time)} - ${toTimeHHMM(r.end_time)}</td><td>${r.room || "-"}</td></tr>`
        )
        .join("");
      const printWindow = window.open("", "_blank", "width=1100,height=700");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>Exam Schedule</title></head><body>
        <h2>Exam Routine</h2>
        <p>Exam: ${examName} | Class: ${className} | Section: ${sectionName}</p>
        <table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;width:100%">
          <thead><tr><th>Date</th><th>Subject</th><th>Class/Sec</th><th>Teacher</th><th>Time</th><th>Room</th></tr></thead>
          <tbody>${htmlRows}</tbody>
        </table>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch {
      setError("Unable to prepare print view.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Exam Schedule Report</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span><span>/</span><span>Examinations</span><span>/</span><span>Exam Schedule Report</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Exam *</option>
                {examTypes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.class_name || item.name || `Class ${item.id}`}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((item) => <option key={item.id} value={item.id}>{item.section_name || item.name || `Section ${item.id}`}</option>)}
              </select>
              <input value={rows.length ? `${rows.length} rows` : "No rows"} readOnly style={{ ...fieldStyle(), color: "var(--text-muted)" }} />
              <button type="button" onClick={() => void search()} style={buttonStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          {rows.length > 0 && (
            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Exam Routine | Exam: {examName}, Class: {className}, Section: {sectionName}</h3>
                <button type="button" style={buttonStyle()} onClick={() => void printReport()}>Print</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Date</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Subject</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Class/Sec</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Teacher</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Time</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.exam_date}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.subject_name}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.class_name} ({row.section_name || "All"})</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.teacher_name || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{toTimeHHMM(row.start_time)} - {toTimeHHMM(row.end_time)}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.room || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
