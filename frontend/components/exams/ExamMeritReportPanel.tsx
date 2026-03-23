"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Exam = { id: number; title: string };
type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; class_id?: number };
type MeritRow = {
  position: number;
  admission_no: string;
  student_name: string;
  roll_no: string;
  subject_count: number;
  total_marks: string;
  average_gpa: string;
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

export default function ExamMeritReportPanel() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [rows, setRows] = useState<MeritRow[]>([]);
  const [error, setError] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((s) => s.class_id === Number(classId));
  }, [sections, classId]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{ exams: Exam[]; classes: SchoolClass[]; sections: Section[] }>("/api/v1/exams/exam-report/index/");
        setExams(data.exams || []);
        setClasses(data.classes || []);
        setSections(data.sections || []);
      } catch {
        setError("Failed to load criteria.");
      }
    };
    void load();
  }, []);

  const search = async () => {
    if (!examId || !classId) {
      setError("Exam and class are required.");
      return;
    }
    try {
      setError("");
      const data = await apiPost<{ merit_list: MeritRow[] }>("/api/v1/exams/exam-report/merit-search/", {
        exam: Number(examId),
        class: Number(classId),
        section: sectionId ? Number(sectionId) : 0,
      });
      setRows(data.merit_list || []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "No Result Found");
    }
  };

  const printReport = async () => {
    if (!examId || !classId) return;
    const params = new URLSearchParams({
      exam_id: String(Number(examId)),
      class_id: String(Number(classId)),
      section_id: sectionId ? String(Number(sectionId)) : "0",
    });
    window.open(`${API_BASE_URL}/api/v1/exams/exam-report/merit-print/?${params.toString()}`, "_blank");
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Merit List Report</h1></div>
      </section>
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={examId} onChange={(e) => setExamId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Exam *</option>
                {exams.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((x) => <option key={x.id} value={x.id}>{x.class_name || x.name || `Class ${x.id}`}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((x) => <option key={x.id} value={x.id}>{x.section_name || x.name || `Section ${x.id}`}</option>)}
              </select>
              <button type="button" onClick={() => void search()} style={buttonStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          {rows.length > 0 && (
            <div className="white-box" style={boxStyle()}>
              <div style={{ marginBottom: 12, textAlign: "right" }}>
                <button type="button" onClick={() => void printReport()} style={buttonStyle("#0f766e")}>Print</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Position</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Roll No</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Subjects</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Total Marks</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Average GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.student_name}-${r.position}`}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.position}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.admission_no}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.student_name}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.roll_no || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.subject_count}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.total_marks}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.average_gpa}</td>
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
