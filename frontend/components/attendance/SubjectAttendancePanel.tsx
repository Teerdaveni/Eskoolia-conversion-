"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; section_name?: string; name?: string; school_class?: number };
type Subject = { id: number; subject_name?: string; name?: string };

type SubjectStudentRow = {
  record_id: number;
  student: number;
  class: number;
  section: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  roll_no: string;
  attendance_type: string | null;
  note: string;
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

function buttonStyle(color = "var(--primary)") {
  return { height: 36, padding: "0 12px", border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, cursor: "pointer" } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

export default function SubjectAttendancePanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  const [students, setStudents] = useState<SubjectStudentRow[]>([]);
  const [attendanceTypeBanner, setAttendanceTypeBanner] = useState("");
  const [searchInfo, setSearchInfo] = useState<{ class_name: string; section_name: string; subject_name: string; date: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredSections = useMemo(() => {
    const id = Number(classId);
    if (!id) return [];
    return sections.filter((s) => s.school_class === id || !s.school_class);
  }, [classId, sections]);

  useEffect(() => {
    const load = async () => {
      const [classData, sectionData] = await Promise.all([
        apiGet<{ classes: SchoolClass[] }>("/api/v1/attendance/subject-attendance/index/"),
        apiGet<Section[] | { results?: Section[] }>("/api/v1/core/sections/"),
      ]);
      setClasses(classData.classes || []);
      setSections(Array.isArray(sectionData) ? sectionData : sectionData.results || []);
    };
    void load();
  }, []);

  const search = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!classId || !sectionId || !subjectId || !attendanceDate) {
      setError("Class, section, subject and attendance date are required.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<{
        students: SubjectStudentRow[];
        attendance_type: string;
        subjects: Subject[];
        search_info: { class_name: string; section_name: string; subject_name: string; date: string };
      }>(`/api/v1/attendance/subject-attendance/search/?class_id=${classId}&section_id=${sectionId}&subject_id=${subjectId}&attendance_date=${attendanceDate}`);
      setStudents(data.students || []);
      setAttendanceTypeBanner(data.attendance_type || "");
      setSearchInfo(data.search_info || null);
      setSubjects(data.subjects || []);
    } catch {
      setError("No Result Found");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateType = (recordId: number, type: string) => {
    setStudents((prev) => prev.map((s) => (s.record_id === recordId ? { ...s, attendance_type: type } : s)));
  };

  const updateNote = (recordId: number, note: string) => {
    setStudents((prev) => prev.map((s) => (s.record_id === recordId ? { ...s, note } : s)));
  };

  const save = async () => {
    if (!classId || !sectionId || !subjectId || !attendanceDate) return;
    try {
      setSaving(true);
      const attendancePayload = Object.fromEntries(
        students.map((s) => [
          String(s.record_id),
          {
            student: s.student,
            class: s.class,
            section: s.section,
            attendance_type: s.attendance_type || "P",
            note: s.note || "",
          },
        ])
      );

      await apiPost("/api/v1/attendance/subject-attendance/store/", {
        class: Number(classId),
        section: Number(sectionId),
        subject: Number(subjectId),
        date: attendanceDate,
        attendance_date: attendanceDate,
        attendance: attendancePayload,
      });

      await search();
    } catch {
      setError("Operation Failed");
    } finally {
      setSaving(false);
    }
  };

  const holiday = async (purpose: "mark" | "unmark") => {
    if (!classId || !sectionId || !subjectId || !attendanceDate) return;
    try {
      await apiPost("/api/v1/attendance/subject-attendance/holiday-store/", {
        purpose,
        class_id: Number(classId),
        section_id: Number(sectionId),
        subject_id: Number(subjectId),
        attendance_date: attendanceDate,
      });
      await search();
    } catch {
      setError("Operation Failed");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Subject Wise Attendance</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span><span>/</span><span>Student Information</span><span>/</span><span>Subject Wise Attendance</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <form onSubmit={(e) => void search(e)} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name || c.name || `Class ${c.id}`}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Section *</option>
                {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.section_name || s.name || `Section ${s.id}`}</option>)}
              </select>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Subject *</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_name || s.name || `Subject ${s.id}`}</option>)}
              </select>
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={fieldStyle()} />
              <button type="submit" style={buttonStyle()}>{loading ? "Searching..." : "Search"}</button>
            </form>
            {error && <div style={{ color: "var(--warning)", marginTop: 8 }}>{error}</div>}
          </div>

          {students.length > 0 && (
            <>
              <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>Class:</strong> {searchInfo?.class_name} &nbsp; <strong>Section:</strong> {searchInfo?.section_name} &nbsp; <strong>Subject:</strong> {searchInfo?.subject_name} &nbsp; <strong>Date:</strong> {searchInfo?.date}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {attendanceTypeBanner !== "H" ? (
                      <button type="button" onClick={() => void holiday("mark")} style={buttonStyle("#6b7280")}>Mark Holiday</button>
                    ) : (
                      <button type="button" onClick={() => void holiday("unmark")} style={buttonStyle("#6b7280")}>Unmark Holiday</button>
                    )}
                    <button type="button" onClick={() => void save()} style={buttonStyle()}>{saving ? "Saving..." : "Attendance"}</button>
                  </div>
                </div>
                {attendanceTypeBanner === "H" && <div style={{ marginTop: 8, padding: 8, border: "1px solid #fbbf24", background: "#fff8e1", borderRadius: 8 }}>Attendance already submitted as Holiday</div>}
                {attendanceTypeBanner && attendanceTypeBanner !== "H" && <div style={{ marginTop: 8, padding: 8, border: "1px solid #10b981", background: "#ecfdf5", borderRadius: 8 }}>Attendance already submitted</div>}
              </div>

              <div className="white-box" style={boxStyle()}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>SL</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Student Name</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Roll Number</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Attendance</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => (
                      <tr key={s.record_id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{idx + 1}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{s.admission_no}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{s.first_name} {s.last_name}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{s.roll_no || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            {(["P", "L", "A", "F"] as const).map((type) => (
                              <label key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <input type="radio" name={`att-${s.record_id}`} value={type} checked={(s.attendance_type || "P") === type} onChange={() => updateType(s.record_id, type)} />
                                <span>{type === "P" ? "Present" : type === "L" ? "Late" : type === "A" ? "Absent" : "Half Day"}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <textarea value={s.note || ""} onChange={(e) => updateNote(s.record_id, e.target.value)} rows={2} style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
