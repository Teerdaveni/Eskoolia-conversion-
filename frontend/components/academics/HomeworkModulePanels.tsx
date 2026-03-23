"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type AcademicYear = { id: number; name: string; is_current: boolean };
type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };
type Subject = { id: number; name: string };
type Student = {
  id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  roll_no: string;
  current_class: number | null;
  current_section: number | null;
};

type Homework = {
  id: number;
  academic_year_id?: number | null;
  class_id: number;
  section_id?: number | null;
  subject_id: number;
  homework_date: string;
  submission_date: string;
  evaluation_date?: string | null;
  marks: string | number;
  description: string;
  file?: string;
};

type HomeworkSubmission = {
  id: number;
  homework_id: number;
  student_id: number;
  marks: string | number;
  complete_status: "C" | "I" | "P";
  note: string;
};

type ApiList<T> = T[] | { results?: T[] };

type EvalDraft = {
  id?: number;
  marks: string;
  complete_status: "C" | "I" | "P";
  note: string;
};

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

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

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<void>(path, { method: "DELETE", headers: { "Content-Type": "application/json" } });
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function buttonStyle(color = "var(--primary)") {
  return {
    height: 36,
    padding: "0 12px",
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
  } as const;
}

function LegacyBreadcrumb({ title, pageLabel }: { title: string; pageLabel: string }) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span>
            <span>/</span>
            <span>Homework</span>
            <span>/</span>
            <span>{pageLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function useHomeworkLookups() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const load = async () => {
      const [yearData, classData, sectionData, subjectData, studentData] = await Promise.all([
        apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        apiGet<ApiList<Subject>>("/api/v1/core/subjects/"),
        apiGet<ApiList<Student>>("/api/v1/students/students/"),
      ]);
      setYears(listData(yearData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
      setSubjects(listData(subjectData));
      setStudents(listData(studentData));
    };
    void load();
  }, []);

  return { years, classes, sections, subjects, students };
}

export function HomeworkAddPagePanel() {
  const { years, classes, sections, subjects } = useHomeworkLookups();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [homeworkDate, setHomeworkDate] = useState(new Date().toISOString().slice(0, 10));
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState("100");
  const [file, setFile] = useState("");
  const [description, setDescription] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((section) => section.school_class === Number(classId));
  }, [classId, sections]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!classId || !subjectId || !description.trim()) {
      setError("Class, subject and description are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await apiPost("/api/v1/academics/homeworks/", {
        academic_year_id: academicYearId ? Number(academicYearId) : undefined,
        class_id: Number(classId),
        section_id: sectionId ? Number(sectionId) : null,
        subject_id: Number(subjectId),
        homework_date: homeworkDate,
        submission_date: submissionDate,
        marks: Number(marks || "0"),
        description: description.trim(),
        file: file.trim(),
      });
      setSuccess("Homework created successfully.");
      setDescription("");
      setFile("");
    } catch {
      setError("Unable to create homework.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Add Homework" pageLabel="Add Homework" />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <form onSubmit={submit} className="white-box" style={boxStyle()}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} style={fieldStyle()}>
                <option value="">Academic Year</option>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>

              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId("");
                }}
                style={fieldStyle()}
              >
                <option value="">Class *</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
                ))}
              </select>

              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>

              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={fieldStyle()}>
                <option value="">Subject *</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>

              <input type="date" value={homeworkDate} onChange={(e) => setHomeworkDate(e.target.value)} style={fieldStyle()} />
              <input type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} style={fieldStyle()} />

              <input type="number" min="0" value={marks} onChange={(e) => setMarks(e.target.value)} style={fieldStyle()} placeholder="Marks" />
              <input value={file} onChange={(e) => setFile(e.target.value)} style={fieldStyle()} placeholder="Attachment URL or file path" />
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Homework description"
              style={{ width: "100%", minHeight: 120, border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginTop: 10 }}
            />

            {error && <p style={{ color: "var(--warning)", margin: "10px 0 0" }}>{error}</p>}
            {success && <p style={{ color: "#059669", margin: "10px 0 0" }}>{success}</p>}

            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={saving} style={buttonStyle()}>
                {saving ? "Saving..." : "Save Homework"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export function HomeworkListPagePanel() {
  const { classes, sections, subjects, students } = useHomeworkLookups();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [error, setError] = useState("");

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [drafts, setDrafts] = useState<Record<number, EvalDraft>>({});
  const [savingEval, setSavingEval] = useState(false);

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((section) => section.school_class === Number(classId));
  }, [classId, sections]);

  const selectedHomeworkStudents = useMemo(() => {
    if (!selectedHomework) return [];
    return students.filter((student) => {
      if (student.current_class !== selectedHomework.class_id) return false;
      if (selectedHomework.section_id) return student.current_section === selectedHomework.section_id;
      return true;
    });
  }, [selectedHomework, students]);

  const loadHomeworks = async () => {
    const params = new URLSearchParams();
    if (classId) params.set("class_id", classId);
    if (sectionId) params.set("section_id", sectionId);
    if (subjectId) params.set("subject_id", subjectId);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const data = await apiGet<ApiList<Homework>>(`/api/v1/academics/homeworks/${suffix}`);
    setHomeworks(listData(data));
  };

  useEffect(() => {
    void loadHomeworks();
  }, []);

  const openEvaluation = async (homework: Homework) => {
    setSelectedHomework(homework);
    setEvaluationDate(homework.evaluation_date || new Date().toISOString().slice(0, 10));
    const data = await apiGet<ApiList<HomeworkSubmission>>(`/api/v1/academics/homework-submissions/?homework_id=${homework.id}`);
    const existing = listData(data);
    const map: Record<number, EvalDraft> = {};
    existing.forEach((row) => {
      map[row.student_id] = {
        id: row.id,
        marks: String(row.marks ?? "0"),
        complete_status: row.complete_status || "P",
        note: row.note || "",
      };
    });
    setDrafts(map);
  };

  const setDraft = (studentId: number, patch: Partial<EvalDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        id: prev[studentId]?.id,
        marks: prev[studentId]?.marks ?? "0",
        complete_status: prev[studentId]?.complete_status ?? "P",
        note: prev[studentId]?.note ?? "",
        ...patch,
      },
    }));
  };

  const saveEvaluation = async () => {
    if (!selectedHomework) return;
    try {
      setSavingEval(true);
      setError("");
      for (const student of selectedHomeworkStudents) {
        const draft = drafts[student.id] || { marks: "0", complete_status: "P", note: "" };
        const payload = {
          homework_id: selectedHomework.id,
          student_id: student.id,
          marks: Number(draft.marks || "0"),
          complete_status: draft.complete_status,
          note: draft.note,
        };
        if (draft.id) {
          await apiPatch(`/api/v1/academics/homework-submissions/${draft.id}/`, payload);
        } else {
          await apiPost("/api/v1/academics/homework-submissions/", payload);
        }
      }
      await apiPatch(`/api/v1/academics/homeworks/${selectedHomework.id}/`, { evaluation_date: evaluationDate });
      await loadHomeworks();
      setSelectedHomework(null);
    } catch {
      setError("Unable to save evaluation.");
    } finally {
      setSavingEval(false);
    }
  };

  const deleteHomework = async (id: number) => {
    try {
      await apiDelete(`/api/v1/academics/homeworks/${id}/`);
      await loadHomeworks();
    } catch {
      setError("Unable to delete homework.");
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Homework List" pageLabel="Homework List" />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Search Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId("");
                }}
                style={fieldStyle()}
              >
                <option value="">All Classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
                ))}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={fieldStyle()}>
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => void loadHomeworks()} style={buttonStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Homework Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Submission Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Marks</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Evaluation Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Description</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {homeworks.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.homework_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.submission_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.marks}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.evaluation_date || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.description}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => void openEvaluation(row)} style={buttonStyle("#2563eb")}>Evaluation</button>
                      <button type="button" onClick={() => void deleteHomework(row.id)} style={{ ...buttonStyle("#dc2626"), marginLeft: 8 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedHomework && (
            <div className="white-box" style={{ ...boxStyle(), marginTop: 12 }}>
              <h3 style={{ marginTop: 0 }}>Homework Evaluation</h3>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Evaluation Date</label>
                <input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} style={{ ...fieldStyle(), maxWidth: 180 }} />
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Admission</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Marks</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHomeworkStudents.map((student) => {
                    const draft = drafts[student.id] || { marks: "0", complete_status: "P", note: "" };
                    return (
                      <tr key={student.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.admission_no}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.first_name} {student.last_name}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <select value={draft.complete_status} onChange={(e) => setDraft(student.id, { complete_status: e.target.value as "C" | "I" | "P" })} style={fieldStyle()}>
                            <option value="P">Pending</option>
                            <option value="C">Completed</option>
                            <option value="I">Incomplete</option>
                          </select>
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <input type="number" min="0" value={draft.marks} onChange={(e) => setDraft(student.id, { marks: e.target.value })} style={fieldStyle()} />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <input value={draft.note} onChange={(e) => setDraft(student.id, { note: e.target.value })} style={fieldStyle()} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <button type="button" onClick={() => void saveEvaluation()} disabled={savingEval} style={buttonStyle()}>
                  {savingEval ? "Saving..." : "Save Evaluation"}
                </button>
                <button type="button" onClick={() => setSelectedHomework(null)} style={{ ...buttonStyle("#6b7280"), marginLeft: 8 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function HomeworkEvaluationReportPagePanel() {
  const { classes, sections, subjects } = useHomeworkLookups();
  const [rows, setRows] = useState<Array<Homework & { completed: number; incomplete: number; pending: number }>>([]);
  const [error, setError] = useState("");

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((section) => section.school_class === Number(classId));
  }, [classId, sections]);

  const search = async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (classId) params.set("class_id", classId);
      if (sectionId) params.set("section_id", sectionId);
      if (subjectId) params.set("subject_id", subjectId);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const homeworksData = await apiGet<ApiList<Homework>>(`/api/v1/academics/homeworks/${suffix}`);
      const homeworks = listData(homeworksData);

      const reportRows: Array<Homework & { completed: number; incomplete: number; pending: number }> = [];
      for (const hw of homeworks) {
        const submissionData = await apiGet<ApiList<HomeworkSubmission>>(`/api/v1/academics/homework-submissions/?homework_id=${hw.id}`);
        const submissions = listData(submissionData);
        reportRows.push({
          ...hw,
          completed: submissions.filter((item) => item.complete_status === "C").length,
          incomplete: submissions.filter((item) => item.complete_status === "I").length,
          pending: submissions.filter((item) => item.complete_status === "P").length,
        });
      }
      setRows(reportRows);
    } catch {
      setRows([]);
      setError("Unable to load homework evaluation report.");
    }
  };

  useEffect(() => {
    void search();
  }, []);

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Homework Evaluation Report" pageLabel="Homework Evaluation Report" />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Search Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId("");
                }}
                style={fieldStyle()}
              >
                <option value="">All Classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
                ))}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={fieldStyle()}>
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => void search()} style={buttonStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Homework Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Submission Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Evaluation Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Completed</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Incomplete</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Pending</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.homework_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.submission_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.evaluation_date || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.completed}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.incomplete}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.pending}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
