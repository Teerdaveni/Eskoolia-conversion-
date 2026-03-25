"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

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

function fieldStyle() {
  return {
    width: "100%",
    height: 36,
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "0 10px",
  } as const;
}

function boxStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 16,
  } as const;
}

function buttonStyle(color = "var(--primary)") {
  return {
    height: 34,
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    borderRadius: 8,
    padding: "0 10px",
    cursor: "pointer",
  } as const;
}

function breadcrumb(title: string) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span>
            <span>/</span>
            <span>Behaviour Records</span>
            <span>/</span>
            <span>{title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type Incident = {
  id: number;
  title: string;
  point: number;
  description: string;
};

type AcademicYear = {
  id: number;
  name: string;
  is_current: boolean;
};

type ClassItem = {
  id: number;
  name: string;
};

type SectionItem = {
  id: number;
  name: string;
  school_class: number;
};

type Student = {
  id: number;
  admission_no: string;
  roll_no: string;
  first_name: string;
  last_name: string;
  current_class: number | null;
  current_section: number | null;
  total_incidents?: number;
  total_points?: number;
};

type Assignment = {
  id: number;
  academic_year: number | null;
  incident: number;
  incident_title: string;
  student: number;
  student_name: string;
  class_id: number | null;
  section_id: number | null;
  point: number;
  comments?: Array<{ id: number; user_name: string; comment: string; created_at: string }>;
  created_at: string;
};

type Setting = {
  student_comment: boolean;
  parent_comment: boolean;
  student_view: boolean;
  parent_view: boolean;
};

type StudentIncidentReportRow = {
  student_id: number;
  student_name: string;
  admission_no: string;
  class_id: number | null;
  section_id: number | null;
  total_points: number;
  total_incidents: number;
  incidents: Array<{ id: number; incident: string; point: number; created_at: string }>;
};

type StudentRankRow = {
  student_id: number;
  student_name: string;
  admission_no: string;
  class_id: number | null;
  section_id: number | null;
  total_points: number;
  total_incidents: number;
};

type ClassSectionRankRow = {
  class_id: number | null;
  section_id: number | null;
  total_points: number;
  total_incidents: number;
  student_count: number;
};

type IncidentWiseRow = {
  incident_id: number;
  incident_title: string;
  assignment_count: number;
  total_points: number;
  students: Array<{ student_id: number; student_name: string; point: number }>;
};

function nameOfClass(id: number | null, classes: ClassItem[]) {
  if (!id) return "-";
  return classes.find((item) => item.id === id)?.name || String(id);
}

function nameOfSection(id: number | null, sections: SectionItem[]) {
  if (!id) return "-";
  return sections.find((item) => item.id === id)?.name || String(id);
}

export function BehaviourIncidentPanel() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [title, setTitle] = useState("");
  const [point, setPoint] = useState("0");
  const [isNegative, setIsNegative] = useState(false);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<ApiList<Incident>>("/api/v1/behaviour/incidents/");
      setRows(listData(data));
    } catch {
      setError("Unable to load incidents.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setPoint("0");
    setIsNegative(false);
    setDescription("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setSuccess("");
      setError("Incident title is required.");
      return;
    }
    try {
      setError("");
      setSuccess("");
      const isEditing = editingId !== null;
      const rawPoint = Number(point || "0");
      const payload = {
        title: title.trim(),
        point: isNegative ? -Math.abs(rawPoint) : Math.abs(rawPoint),
        description: description.trim(),
      };
      if (editingId) {
        await apiPatch(`/api/v1/behaviour/incidents/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/behaviour/incidents/", payload);
      }
      reset();
      await load();
      setSuccess(isEditing ? "Incident updated successfully." : "Incident saved successfully.");
    } catch (err) {
      setSuccess("");
      setError(err instanceof Error ? err.message : "Unable to save incident.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Incident")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="row" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Incident" : "Add Incident"}</h3>
            <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" style={fieldStyle()} />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" value={Math.abs(Number(point || 0))} onChange={(e) => setPoint(e.target.value)} placeholder="Point" style={{ ...fieldStyle(), flex: 1 }} />
                <label style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", cursor: "pointer" }}>
                  <input type="checkbox" checked={isNegative} onChange={(e) => setIsNegative(e.target.checked)} />
                  Is This Negative Incident
                </label>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ width: "100%", minHeight: 84, border: "1px solid var(--line)", borderRadius: 8, padding: 10 }} />
              <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
            </form>
          </div>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Incident List</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Title</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Point</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.title}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.point}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setTitle(row.title); setIsNegative(row.point < 0); setPoint(String(Math.abs(row.point))); setDescription(row.description || ""); }}>Edit</button>
                        <button
                          type="button"
                          style={buttonStyle("#dc2626")}
                          onClick={() =>
                            void apiDelete(`/api/v1/behaviour/incidents/${row.id}/`)
                              .then(async () => {
                                setError("");
                                await load();
                                setSuccess("Incident deleted successfully.");
                              })
                              .catch(() => {
                                setSuccess("");
                                setError("Unable to delete incident.");
                              })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={3} style={{ padding: 10, color: "var(--text-muted)" }}>No incidents found.</td></tr>}
              </tbody>
            </table>
            {success && <p style={{ color: "#16a34a", marginTop: 8 }}>{success}</p>}
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      </div></section>
    </div>
  );
}

export function BehaviourAssignIncidentPanel() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<number[]>([]);
  const [commentByAssignment, setCommentByAssignment] = useState<Record<number, string>>({});

  const loadLookups = async () => {
    try {
      setError("");
      const [incidentData, classData, sectionData, yearData] = await Promise.all([
        apiGet<ApiList<Incident>>("/api/v1/behaviour/incidents/?active_status=true"),
        apiGet<ApiList<ClassItem>>("/api/v1/core/classes/"),
        apiGet<ApiList<SectionItem>>("/api/v1/core/sections/"),
        apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
      ]);
      setIncidents(listData(incidentData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
      const yearRows = listData(yearData);
      setYears(yearRows);
      const currentYear = yearRows.find((item) => item.is_current);
      if (currentYear) {
        setYearId(String(currentYear.id));
      }
    } catch {
      setError("Unable to load assign-incident form.");
    }
  };

  const loadStudentSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (yearId) params.set("academic_year_id", yearId);
      if (classId) params.set("class_id", classId);
      if (sectionId) params.set("section_id", sectionId);
      if (search.trim()) {
        params.set("name", search.trim());
      }
      const data = await apiGet<Student[]>(`/api/v1/behaviour/assignments/students-summary/?${params.toString()}`);
      setStudents(data);
    } catch {
      setError("Unable to load student incident summary.");
    }
  };

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (yearId) params.set("academic_year_id", yearId);
      if (classId) params.set("class_id", classId);
      if (sectionId) params.set("section_id", sectionId);
      const data = await apiGet<ApiList<Assignment>>(`/api/v1/behaviour/assignments/?${params.toString()}`);
      setAssignments(listData(data));
    } catch {
      setError("Unable to load assigned incidents.");
    }
  };

  useEffect(() => {
    void loadLookups();
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [yearId, classId, sectionId]);

  useEffect(() => {
    void loadStudentSummary();
  }, [yearId, classId, sectionId, search]);

  const filteredSections = useMemo(() => {
    if (!classId) return sections;
    return sections.filter((item) => item.school_class === Number(classId));
  }, [sections, classId]);

  const filteredStudents = useMemo(() => students, [students]);

  const toggleStudent = (studentId: number) => {
    setSelectedStudentIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };

  const toggleIncident = (incidentId: number) => {
    setSelectedIncidentIds((prev) => (prev.includes(incidentId) ? prev.filter((id) => id !== incidentId) : [...prev, incidentId]));
  };

  const assignSelected = async () => {
    if (!selectedStudentIds.length || !selectedIncidentIds.length) {
      setError("Select student(s) and incident(s) first.");
      return;
    }
    try {
      setError("");
      setSuccess("");
      await apiPost("/api/v1/behaviour/assignments/assign-bulk/", {
        academic_year_id: yearId ? Number(yearId) : null,
        class_id: classId ? Number(classId) : null,
        section_id: sectionId ? Number(sectionId) : null,
        student_ids: selectedStudentIds,
        incident_ids: selectedIncidentIds,
      });
      setSelectedStudentIds([]);
      setSelectedIncidentIds([]);
      setSuccess("Incident assigned successfully.");
      await loadAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign incident.");
    }
  };

  const addComment = async (assignmentId: number) => {
    const comment = (commentByAssignment[assignmentId] || "").trim();
    if (!comment) return;
    try {
      setError("");
      await apiPost("/api/v1/behaviour/comments/", {
        assigned_incident: assignmentId,
        comment,
      });
      setCommentByAssignment((prev) => ({ ...prev, [assignmentId]: "" }));
      setSuccess("Comment saved.");
      await loadAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save comment.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Assign Incident")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={fieldStyle()}>
              <option value="">Academic Year</option>
              {years.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
              <option value="">Class</option>
              {classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
              <option value="">Section</option>
              {filteredSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student name/admission" style={fieldStyle()} />
          </div>
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Choose Incident(s)</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {incidents.map((incident) => (
              <label key={incident.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={selectedIncidentIds.includes(incident.id)} onChange={() => toggleIncident(incident.id)} />
                {incident.title} ({incident.point})
              </label>
            ))}
          </div>
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Student List</h3>
            <button type="button" style={buttonStyle()} onClick={() => void assignSelected()}>Assign Incident</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}><input type="checkbox" checked={filteredStudents.length > 0 && filteredStudents.every((row) => selectedStudentIds.includes(row.id))} onChange={(e) => setSelectedStudentIds(e.target.checked ? filteredStudents.map((row) => row.id) : [])} /></th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Total Incident</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Total Point</th></tr></thead>
            <tbody>
              {filteredStudents.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}><input type="checkbox" checked={selectedStudentIds.includes(row.id)} onChange={() => toggleStudent(row.id)} /></td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{`${row.first_name || ""} ${row.last_name || ""}`.trim()}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_incidents ?? 0}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_points ?? 0}</td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan={6} style={{ padding: 10, color: "var(--text-muted)" }}>No students found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="white-box" style={boxStyle()}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Assigned Incident List</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Incident</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Point</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Comment</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {assignments.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.student_name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfClass(row.class_id, classes)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfSection(row.section_id, sections)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.incident_title}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.point}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    {row.comments && row.comments.length > 0 && (
                      <div style={{ marginBottom: 6, display: "grid", gap: 4 }}>
                        {row.comments.map((item) => (
                          <div key={item.id} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            <strong>{item.user_name || "User"}:</strong> {item.comment}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                      <input value={commentByAssignment[row.id] || ""} onChange={(e) => setCommentByAssignment((prev) => ({ ...prev, [row.id]: e.target.value }))} placeholder="Add comment" style={fieldStyle()} />
                      <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void addComment(row.id)}>Save</button>
                    </div>
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/behaviour/assignments/${row.id}/`).then(loadAssignments).catch(() => setError("Unable to delete assignment."))}>Delete</button>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && <tr><td colSpan={7} style={{ padding: 10, color: "var(--text-muted)" }}>No assigned incidents found.</td></tr>}
            </tbody>
          </table>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", marginTop: 8 }}>{success}</p>}
        </div>
      </div></section>
    </div>
  );
}

function BehaviourReportCriteria({
  title,
  yearId,
  setYearId,
  classId,
  setClassId,
  sectionId,
  setSectionId,
  years,
  classes,
  sections,
  onSearch,
}: {
  title: string;
  yearId: string;
  setYearId: (value: string) => void;
  classId: string;
  setClassId: (value: string) => void;
  sectionId: string;
  setSectionId: (value: string) => void;
  years: AcademicYear[];
  classes: ClassItem[];
  sections: SectionItem[];
  onSearch: () => void;
}) {
  const filteredSections = !classId ? sections : sections.filter((row) => row.school_class === Number(classId));
  return (
    <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
        <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={fieldStyle()}>
          <option value="">Academic Year</option>
          {years.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
          <option value="">Class</option>
          {classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
          <option value="">Section</option>
          {filteredSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        <button type="button" style={buttonStyle()} onClick={onSearch}>Search</button>
      </div>
    </div>
  );
}

function useBehaviourLookups() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [yearData, classData, sectionData] = await Promise.all([
        apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
        apiGet<ApiList<ClassItem>>("/api/v1/core/classes/"),
        apiGet<ApiList<SectionItem>>("/api/v1/core/sections/"),
      ]);
      setYears(listData(yearData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
    };
    void load();
  }, []);

  return { years, classes, sections };
}

export function BehaviourStudentIncidentReportPanel() {
  const { years, classes, sections } = useBehaviourLookups();
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rows, setRows] = useState<StudentIncidentReportRow[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (yearId) params.set("academic_year_id", yearId);
      if (classId) params.set("class_id", classId);
      if (sectionId) params.set("section_id", sectionId);
      const data = await apiGet<StudentIncidentReportRow[]>(`/api/v1/behaviour/assignments/student-incident-report/?${params.toString()}`);
      setRows(data);
      setError("");
    } catch {
      setError("Unable to load report.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Student Incident Report")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <BehaviourReportCriteria title="Select Criteria" yearId={yearId} setYearId={setYearId} classId={classId} setClassId={setClassId} sectionId={sectionId} setSectionId={setSectionId} years={years} classes={classes} sections={sections} onSearch={() => void load()} />
        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Incidents</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Total Point</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student_id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.student_name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfClass(row.class_id, classes)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfSection(row.section_id, sections)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_incidents}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_points}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 10, color: "var(--text-muted)" }}>No report data found.</td></tr>}
            </tbody>
          </table>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>
      </div></section>
    </div>
  );
}

export function BehaviourStudentRankReportPanel() {
  const { years, classes, sections } = useBehaviourLookups();
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [operator, setOperator] = useState<"above" | "below">("above");
  const [point, setPoint] = useState("0");
  const [rows, setRows] = useState<StudentRankRow[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (yearId) params.set("academic_year_id", yearId);
      if (classId) params.set("class_id", classId);
      if (sectionId) params.set("section_id", sectionId);
      params.set("operator", operator);
      params.set("point", point || "0");
      const data = await apiGet<StudentRankRow[]>(`/api/v1/behaviour/assignments/student-rank-report/?${params.toString()}`);
      setRows(data);
      setError("");
    } catch {
      setError("Unable to load rank report.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Student Behaviour Rank Report")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <BehaviourReportCriteria title="Select Criteria" yearId={yearId} setYearId={setYearId} classId={classId} setClassId={setClassId} sectionId={sectionId} setSectionId={setSectionId} years={years} classes={classes} sections={sections} onSearch={() => void load()} />
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 160px auto", gap: 8 }}>
            <select value={operator} onChange={(e) => setOperator(e.target.value as "above" | "below")} style={fieldStyle()}><option value="above">Point Above/Equal</option><option value="below">Point Below</option></select>
            <input type="number" value={point} onChange={(e) => setPoint(e.target.value)} style={fieldStyle()} />
            <button type="button" style={buttonStyle()} onClick={() => void load()}>Apply Point Filter</button>
          </div>
        </div>
        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Incidents</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Total Point</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student_id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.student_name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfClass(row.class_id, classes)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfSection(row.section_id, sections)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_incidents}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_points}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 10, color: "var(--text-muted)" }}>No rank data found.</td></tr>}
            </tbody>
          </table>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>
      </div></section>
    </div>
  );
}

export function BehaviourClassSectionRankReportPanel() {
  const { classes, sections } = useBehaviourLookups();
  const [rows, setRows] = useState<ClassSectionRankRow[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiGet<ClassSectionRankRow[]>("/api/v1/behaviour/assignments/class-section-rank-report/");
      setRows(data);
      setError("");
    } catch {
      setError("Unable to load class/section rank report.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="legacy-panel">
      {breadcrumb("Class Section Wise Rank Report")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Students</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Incidents</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Total Point</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.class_id}-${row.section_id}-${idx}`}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfClass(row.class_id, classes)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{nameOfSection(row.section_id, sections)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.student_count}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_incidents}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_points}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 10, color: "var(--text-muted)" }}>No rank data found.</td></tr>}
            </tbody>
          </table>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>
      </div></section>
    </div>
  );
}

export function BehaviourIncidentWiseReportPanel() {
  const [rows, setRows] = useState<IncidentWiseRow[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiGet<IncidentWiseRow[]>("/api/v1/behaviour/assignments/incident-wise-report/");
      setRows(data);
      setError("");
    } catch {
      setError("Unable to load incident-wise report.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="legacy-panel">
      {breadcrumb("Incident Wise Report")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Incident</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Assigned</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Total Point</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.incident_id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.incident_title}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.assignment_count}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.total_points}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={3} style={{ padding: 10, color: "var(--text-muted)" }}>No incident-wise data found.</td></tr>}
            </tbody>
          </table>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>
      </div></section>
    </div>
  );
}

export function BehaviourSettingsPanel() {
  const [settings, setSettings] = useState<Setting>({
    student_comment: false,
    parent_comment: false,
    student_view: false,
    parent_view: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<Setting>("/api/v1/behaviour/settings/");
      setSettings(data);
    } catch {
      setError("Unable to load settings.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    try {
      setError("");
      setSuccess("");
      const payload = {
        student_comment: settings.student_comment,
        parent_comment: settings.parent_comment,
        student_view: settings.student_view,
        parent_view: settings.parent_view,
      };
      await apiPatch("/api/v1/behaviour/settings/", payload);
      setSuccess("Settings saved successfully.");
    } catch {
      setError("Unable to save settings.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Behaviour Record Setting")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={boxStyle()}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Behaviour Record Setting</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={settings.student_comment} onChange={(e) => setSettings((prev) => ({ ...prev, student_comment: e.target.checked }))} /> Student Comment</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={settings.parent_comment} onChange={(e) => setSettings((prev) => ({ ...prev, parent_comment: e.target.checked }))} /> Parent Comment</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={settings.student_view} onChange={(e) => setSettings((prev) => ({ ...prev, student_view: e.target.checked }))} /> Student View</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={settings.parent_view} onChange={(e) => setSettings((prev) => ({ ...prev, parent_view: e.target.checked }))} /> Parent View</label>
          </div>
          <button type="button" style={buttonStyle()} onClick={() => void save()}>Save Settings</button>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", marginTop: 8 }}>{success}</p>}
        </div>
      </div></section>
    </div>
  );
}
