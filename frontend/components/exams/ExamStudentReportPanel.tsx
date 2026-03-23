"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Exam = { id: number; title: string };
type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; class_id?: number };
type Student = {
  id: number;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  roll_no?: string;
  class_id?: number;
  section_id?: number;
};
type SubjectRow = {
  subject_id: number;
  subject_name: string;
  total_marks: string;
  grade: string;
  gpa: string;
  is_absent: boolean;
  remarks: string;
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

export default function ExamStudentReportPanel() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [meta, setMeta] = useState<{ student_name?: string; grand_total?: string; average_gpa?: string; result_published?: boolean } | null>(null);
  const [error, setError] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((s) => s.class_id === Number(classId));
  }, [sections, classId]);

  const filteredStudents = useMemo(() => {
    if (!classId) return [];
    return students.filter((s) => {
      if (s.class_id !== Number(classId)) return false;
      if (sectionId && s.section_id !== Number(sectionId)) return false;
      return true;
    });
  }, [students, classId, sectionId]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{ exams: Exam[]; classes: SchoolClass[]; sections: Section[]; students: Student[] }>("/api/v1/exams/exam-report/index/");
        setExams(data.exams || []);
        setClasses(data.classes || []);
        setSections(data.sections || []);
        setStudents(data.students || []);
      } catch {
        setError("Failed to load report criteria.");
      }
    };
    void load();
  }, []);

  const search = async () => {
    if (!examId || !classId || !studentId) {
      setError("Exam, class and student are required.");
      return;
    }

    try {
      setError("");
      const data = await apiPost<{
        student: { name: string };
        subjects: SubjectRow[];
        grand_total: string;
        average_gpa: string;
        result_published: boolean;
      }>("/api/v1/exams/exam-report/student-search/", {
        exam: Number(examId),
        class: Number(classId),
        section: sectionId ? Number(sectionId) : 0,
        student: Number(studentId),
      });

      setRows(data.subjects || []);
      setMeta({
        student_name: data.student?.name || "",
        grand_total: data.grand_total,
        average_gpa: data.average_gpa,
        result_published: data.result_published,
      });
    } catch (e) {
      setRows([]);
      setMeta(null);
      setError(e instanceof Error ? e.message : "No Result Found");
    }
  };

  const printReport = async () => {
    if (!examId || !classId || !studentId) return;
    const params = new URLSearchParams({
      exam_id: String(Number(examId)),
      class_id: String(Number(classId)),
      section_id: sectionId ? String(Number(sectionId)) : "0",
      student_id: String(Number(studentId)),
    });
    window.open(`${API_BASE_URL}/api/v1/exams/exam-report/student-print/?${params.toString()}`, "_blank");
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Student Mark Sheet Report</h1></div>
      </section>
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              <select value={examId} onChange={(e) => setExamId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Exam *</option>
                {exams.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); setStudentId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((x) => <option key={x.id} value={x.id}>{x.class_name || x.name || `Class ${x.id}`}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => { setSectionId(e.target.value); setStudentId(""); }} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((x) => <option key={x.id} value={x.id}>{x.section_name || x.name || `Section ${x.id}`}</option>)}
              </select>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Student *</option>
                {filteredStudents.map((x) => <option key={x.id} value={x.id}>{(x.first_name || "") + " " + (x.last_name || "")} ({x.admission_no || "-"})</option>)}
              </select>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => void search()} style={buttonStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          {rows.length > 0 && meta && (
            <div className="white-box" style={boxStyle()}>
              <div style={{ marginBottom: 12, textAlign: "right" }}>
                <button type="button" onClick={() => void printReport()} style={buttonStyle("#0f766e")}>Print</button>
              </div>
              <p style={{ margin: "0 0 8px" }}><strong>Student:</strong> {meta.student_name}</p>
              <p style={{ margin: "0 0 8px" }}><strong>Grand Total:</strong> {meta.grand_total}</p>
              <p style={{ margin: "0 0 8px" }}><strong>Average GPA:</strong> {meta.average_gpa}</p>
              <p style={{ margin: "0 0 16px" }}><strong>Result Status:</strong> {meta.result_published ? "Published" : "Not Published"}</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Subject</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Marks</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Grade</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>GPA</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Attendance</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.subject_id}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.subject_name}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.total_marks}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.grade || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.gpa}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.is_absent ? "Absent" : "Present"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{r.remarks || "-"}</td>
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
