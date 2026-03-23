"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Exam = { id: number; title: string };
type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; class_id?: number };
type StudentRow = {
  student_record_id: number;
  student_id: number;
  admission_no?: string;
  roll_no?: string;
  first_name?: string;
  last_name?: string;
};

type Setting = {
  school_name?: boolean;
  student_photo?: boolean;
  student_name?: boolean;
  roll_no?: boolean;
  admission_no?: boolean;
  class_section?: boolean;
  exam_name?: boolean;
  academic_year_label?: boolean;
};

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || body?.detail || `GET failed ${res.status}`);
  }
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
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

export default function ExamPlanSeatPlanPanel() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({});
  const [oldIds, setOldIds] = useState<number[]>([]);

  const [setting, setSetting] = useState<Setting | null>(null);
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((s) => s.class_id === Number(classId));
  }, [sections, classId]);

  const loadIndex = async () => {
    const data = await apiGet<{ exams: Exam[]; classes: SchoolClass[]; sections: Section[] }>("/api/v1/exams/exam-plan/seat-plan/");
    setExams(data.exams || []);
    setClasses(data.classes || []);
    setSections(data.sections || []);
  };

  const loadSetting = async () => {
    const data = await apiGet<{ setting: Setting }>("/api/v1/exams/exam-plan/seat-plan/setting/");
    setSetting(data.setting || null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadIndex(), loadSetting()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load seat plan page.");
      }
    };
    void init();
  }, []);

  const search = async () => {
    if (!examId || !classId || !sectionId) {
      setError("Exam, class and section are required.");
      return;
    }
    try {
      setError("");
      setMessage("");
      const data = await apiPost<{ records: StudentRow[]; seat_plan_ids: number[] }>("/api/v1/exams/exam-plan/seat-plan/search/", {
        exam: Number(examId),
        class: Number(classId),
        section: Number(sectionId),
      });
      setRows(data.records || []);
      setOldIds(data.seat_plan_ids || []);
      const next: Record<number, boolean> = {};
      (data.records || []).forEach((r) => {
        next[r.student_record_id] = Boolean((data.seat_plan_ids || []).includes(r.student_record_id));
      });
      setSelectedMap(next);
    } catch (e) {
      setRows([]);
      setOldIds([]);
      setSelectedMap({});
      setError(e instanceof Error ? e.message : "Search failed.");
    }
  };

  const generate = async () => {
    try {
      setError("");
      const data: Record<string, { student_record_id: number; checked: 1 }> = {};
      Object.keys(selectedMap).forEach((key) => {
        const id = Number(key);
        if (selectedMap[id]) data[String(id)] = { student_record_id: id, checked: 1 };
      });
      await apiPost("/api/v1/exams/exam-plan/seat-plan/generate/", {
        exam_type_id: Number(examId),
        data,
      });
      setMessage("Operation successful");
      await search();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20"><div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Exam Plan - Seat Plan</h1></div></section>
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} style={fieldStyle()}>
              <option value="">Select Exam *</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
              <option value="">Select Class *</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name || c.name || `Class ${c.id}`}</option>)}
            </select>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
              <option value="">Select Section *</option>
              {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.section_name || s.name || `Section ${s.id}`}</option>)}
            </select>
            <button type="button" onClick={() => void search()} style={buttonStyle()}>Search</button>
            <button type="button" onClick={() => void generate()} style={buttonStyle("#16a34a")}>Generate</button>
          </div>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          {message && <p style={{ color: "#059669", marginTop: 8 }}>{message}</p>}
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Seat Plan Setting</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            School Name: {setting?.school_name ? "Yes" : "No"}, Student Name: {setting?.student_name ? "Yes" : "No"}, Roll No: {setting?.roll_no ? "Yes" : "No"}
          </p>
        </div>

        <div className="white-box" style={boxStyle()}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Student List</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>Select</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>Admission No</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>Name</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>Roll No</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>Already Generated</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 12, color: "var(--muted)" }}>No records found.</td></tr>}
                {rows.map((row) => (
                  <tr key={row.student_record_id}>
                    <td style={{ borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedMap[row.student_record_id])}
                        onChange={(e) => setSelectedMap((prev) => ({ ...prev, [row.student_record_id]: e.target.checked }))}
                      />
                    </td>
                    <td style={{ borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>{row.admission_no || "-"}</td>
                    <td style={{ borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>{(row.first_name || "") + " " + (row.last_name || "")}</td>
                    <td style={{ borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>{row.roll_no || "-"}</td>
                    <td style={{ borderBottom: "1px solid var(--line)", padding: "8px 6px" }}>{oldIds.includes(row.student_record_id) ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div></section>
    </div>
  );
}
