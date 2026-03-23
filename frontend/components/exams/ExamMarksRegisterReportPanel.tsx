"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Exam = { id: number; title: string };
type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; class_id?: number };
type Subject = { id: number; subject_name?: string; name?: string };
type Part = { id: number; exam_title: string; exam_mark: string };

type RegisterPart = { exam_setup_id: number; marks: string };
type RegisterRow = {
  id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  roll_no: string;
  is_absent: boolean;
  total_marks: string;
  total_gpa_point: string;
  total_gpa_grade: string;
  teacher_remarks: string;
  parts: RegisterPart[];
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

export default function ExamMarksRegisterReportPanel() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [parts, setParts] = useState<Part[]>([]);
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [error, setError] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((s) => s.class_id === Number(classId));
  }, [sections, classId]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{ exams: Exam[]; classes: SchoolClass[]; sections: Section[]; subjects: Subject[] }>("/api/v1/exams/exam-marks/index/");
        setExams(data.exams || []);
        setClasses(data.classes || []);
        setSections(data.sections || []);
        setSubjects(data.subjects || []);
      } catch {
        setError("Failed to load criteria.");
      }
    };
    void load();
  }, []);

  const search = async () => {
    if (!examId || !classId || !subjectId) {
      setError("Exam, class and subject are required.");
      return;
    }
    try {
      setError("");
      const data = await apiPost<{ marks_registers: RegisterRow[]; marks_entry_form: Part[] }>("/api/v1/exams/exam-marks/report-search/", {
        exam: Number(examId),
        class: Number(classId),
        section: sectionId ? Number(sectionId) : 0,
        subject: Number(subjectId),
      });
      setRows(data.marks_registers || []);
      setParts(data.marks_entry_form || []);
    } catch (e) {
      setRows([]);
      setParts([]);
      setError(e instanceof Error ? e.message : "No Result Found");
    }
  };

  const partValue = (row: RegisterRow, partId: number) => {
    const found = row.parts?.find((p) => p.exam_setup_id === partId);
    return found?.marks ?? "0";
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Marks Register</h1></div>
      </section>
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={examId} onChange={(e) => setExamId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Exam *</option>
                {exams.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((x) => <option key={x.id} value={x.id}>{x.class_name || x.name || `Class ${x.id}`}</option>)}
              </select>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Subject *</option>
                {subjects.map((x) => <option key={x.id} value={x.id}>{x.subject_name || x.name || `Subject ${x.id}`}</option>)}
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
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Student Name</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Roll No</th>
                      {parts.map((part) => (
                        <th key={part.id} style={{ padding: 8, borderBottom: "1px solid var(--line)", minWidth: 120 }}>{part.exam_title} ({part.exam_mark})</th>
                      ))}
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Total</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Grade</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>GPA</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Attendance</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.first_name} {row.last_name}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                        {parts.map((part) => (
                          <td key={`${row.id}-${part.id}`} style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{partValue(row, part.id)}</td>
                        ))}
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_marks}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_gpa_grade || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_gpa_point}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_absent ? "Absent" : "Present"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.teacher_remarks || "-"}</td>
                      </tr>
                    ))}
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
