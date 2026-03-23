"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; class_id?: number; school_class?: number };
type Subject = { id: number; subject_name?: string; name?: string };
type ExamType = { id: number; title: string };

type SetupRow = {
  id?: number;
  exam_title: string;
  exam_mark: string;
};

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", headers: authHeaders() });
  if (!response.ok) throw new Error(`GET failed ${response.status}`);
  return (await response.json()) as T;
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || body?.detail || `POST failed ${response.status}`);
  }
  return (await response.json()) as T;
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

export default function ExamSetupPanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examTermId, setExamTermId] = useState("");
  const [totalExamMark, setTotalExamMark] = useState("0");

  const [rows, setRows] = useState<SetupRow[]>([{ exam_title: "", exam_mark: "0" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    const id = Number(classId);
    return sections.filter((s) => (s.class_id ?? s.school_class) === id);
  }, [classId, sections]);

  const totalMark = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.exam_mark || 0), 0).toFixed(2),
    [rows]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{
          classes: SchoolClass[];
          sections: Section[];
          subjects: Subject[];
          exam_types: ExamType[];
        }>("/api/v1/exams/exam-setup/index/");
        setClasses(data.classes || []);
        setSections(data.sections || []);
        setSubjects(data.subjects || []);
        setExamTypes(data.exam_types || []);
      } catch {
        setError("Failed to load exam setup criteria.");
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const examTypeId = params.get("exam_type_id");
    if (examTypeId) setExamTermId(examTypeId);
  }, []);

  const searchExisting = async () => {
    if (!classId || !sectionId || !subjectId || !examTermId) return;
    try {
      const data = await apiGet<{ items: Array<{ exam_title: string; exam_mark: string }>; totalMark: string }>(
        `/api/v1/exams/exam-setup/search/?class=${classId}&section=${sectionId}&subject=${subjectId}&exam_term_id=${examTermId}`
      );
      if ((data.items || []).length > 0) {
        setRows(data.items.map((item) => ({ exam_title: item.exam_title, exam_mark: item.exam_mark })));
        setTotalExamMark(data.totalMark || "0");
      }
    } catch {
      // Keep empty form if no setup is found.
    }
  };

  const onCriteriaChange = (next: Partial<{ classId: string; sectionId: string; subjectId: string; examTermId: string }>) => {
    setClassId(next.classId ?? classId);
    setSectionId(next.sectionId ?? sectionId);
    setSubjectId(next.subjectId ?? subjectId);
    setExamTermId(next.examTermId ?? examTermId);
  };

  useEffect(() => {
    void searchExisting();
  }, [classId, sectionId, subjectId, examTermId]);

  const addRow = () => setRows((prev) => [...prev, { exam_title: "", exam_mark: "0" }]);

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateRow = (index: number, key: "exam_title" | "exam_mark", value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!classId || !sectionId || !subjectId || !examTermId) {
      setError("Class, section, subject and exam term are required.");
      return;
    }

    if (rows.some((row) => !row.exam_title.trim())) {
      setError("Each exam title is required.");
      return;
    }

    try {
      setLoading(true);
      await apiPost("/api/v1/exams/exam-setup/store/", {
        class: Number(classId),
        section: Number(sectionId),
        subject: Number(subjectId),
        exam_term_id: Number(examTermId),
        total_exam_mark: Number(totalExamMark || 0).toFixed(2),
        totalMark: Number(totalMark || 0).toFixed(2),
        exam_title: rows.map((row) => row.exam_title.trim()),
        exam_mark: rows.map((row) => Number(row.exam_mark || 0).toFixed(2)),
      });
      setSuccess("Operation successful");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Exam Setup</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span><span>/</span><span>Examinations</span><span>/</span><span>Exam Setup</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <form onSubmit={(e) => void submit(e)}>
            <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 12 }}>
              <div className="white-box" style={boxStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>Exam Criteria</h3>

                <div style={{ display: "grid", gap: 10 }}>
                  <select
                    value={examTermId}
                    onChange={(e) => onCriteriaChange({ examTermId: e.target.value })}
                    style={fieldStyle()}
                  >
                    <option value="">Select Exam Term *</option>
                    {examTypes.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>

                  <select
                    value={classId}
                    onChange={(e) => onCriteriaChange({ classId: e.target.value, sectionId: "" })}
                    style={fieldStyle()}
                  >
                    <option value="">Select Class *</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>{item.class_name || item.name || `Class ${item.id}`}</option>
                    ))}
                  </select>

                  <select
                    value={sectionId}
                    onChange={(e) => onCriteriaChange({ sectionId: e.target.value })}
                    style={fieldStyle()}
                  >
                    <option value="">Select Section *</option>
                    {filteredSections.map((item) => (
                      <option key={item.id} value={item.id}>{item.section_name || item.name || `Section ${item.id}`}</option>
                    ))}
                  </select>

                  <select
                    value={subjectId}
                    onChange={(e) => onCriteriaChange({ subjectId: e.target.value })}
                    style={fieldStyle()}
                  >
                    <option value="">Select Subject *</option>
                    {subjects.map((item) => (
                      <option key={item.id} value={item.id}>{item.subject_name || item.name || `Subject ${item.id}`}</option>
                    ))}
                  </select>

                  <div>
                    <label style={{ display: "block", marginBottom: 6 }}>Exam Mark</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalExamMark}
                      onChange={(e) => setTotalExamMark(e.target.value)}
                      style={fieldStyle()}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ margin: 0 }}>Add Mark Distributions</h3>
                    <button type="button" onClick={addRow} style={buttonStyle()}>Add</button>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                        <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Exam Title</th>
                        <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Exam Mark</th>
                        <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={`row-${index}`}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <input
                              value={row.exam_title}
                              onChange={(e) => updateRow(index, "exam_title", e.target.value)}
                              placeholder="Exam Title"
                              style={fieldStyle()}
                            />
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.exam_mark}
                              onChange={(e) => updateRow(index, "exam_mark", e.target.value)}
                              style={fieldStyle()}
                            />
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <button type="button" onClick={() => removeRow(index)} style={buttonStyle("#dc2626")}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th style={{ padding: 8, borderTop: "1px solid var(--line)", textAlign: "left" }}>Result</th>
                        <th style={{ padding: 8, borderTop: "1px solid var(--line)", textAlign: "left" }}>{totalMark}</th>
                        <th style={{ padding: 8, borderTop: "1px solid var(--line)" }} />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="white-box" style={boxStyle()}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button type="submit" style={buttonStyle()} disabled={loading}>
                      {loading ? "Saving..." : "Add Mark Distribution"}
                    </button>
                  </div>
                  {error && <p style={{ color: "var(--warning)", marginTop: 10 }}>{error}</p>}
                  {success && <p style={{ color: "#059669", marginTop: 10 }}>{success}</p>}
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
