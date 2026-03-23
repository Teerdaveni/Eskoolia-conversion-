"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type AcademicYear = { id: number; name: string; is_current: boolean };
type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };
type ApiList<T> = T[] | { results?: T[] };

type StudentRow = {
  id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  roll_no: string;
  attendance_type: string | null;
  attendance_note: string;
};

type AttendanceEntry = {
  student_id: number;
  attendance_type: string;
  notes: string;
};

type MonthlyReport = {
  student_id: number;
  admission_no: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  holiday: number;
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

function listData<T>(v: ApiList<T>): T[] {
  return Array.isArray(v) ? v : v.results ?? [];
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function btnStyle(color = "var(--primary)") {
  return { height: 36, padding: "0 14px", border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 13 } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

function LegacyBreadcrumb({ title }: { title: string }) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span><span>/</span><span>Attendance</span><span>/</span><span>{title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StudentAttendancePanel() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [academicYearId, setAcademicYearId] = useState("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceEntry>>({});
  const [markHoliday, setMarkHoliday] = useState(false);
  const [attendanceTypeBanner, setAttendanceTypeBanner] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Report state
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [report, setReport] = useState<MonthlyReport[]>([]);
  const [reportLoaded, setReportLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const [yearData, classData, sectionData] = await Promise.all([
          apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
          apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
          apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        ]);
        setYears(listData(yearData));
        setClasses(listData(classData));
        setSections(listData(sectionData));
      } catch {
        setError("Unable to load attendance criteria.");
      }
    };
    void load();
  }, []);

  const filteredSections = useMemo(() => {
    const id = Number(classId);
    if (!id) return [];
    return sections.filter((s) => s.school_class === id);
  }, [classId, sections]);

  const searchStudents = async () => {
    if (!classId || !sectionId || !attendanceDate) {
      setError("Class, section and date are required.");
      return;
    }
    try {
      setError("");
      const data = await apiPost<{
        students: StudentRow[];
        attendance_type: string;
      }>(
        "/api/v1/attendance/student-attendance/student-search/",
        {
          class_id: Number(classId),
          section_id: Number(sectionId),
          attendance_date: attendanceDate,
        }
      );
      setStudents(data.students || []);
      setAttendanceTypeBanner(data.attendance_type || "");
      const init: Record<number, AttendanceEntry> = {};
      (data.students || []).forEach((s) => {
        init[s.id] = {
          student_id: s.id,
          attendance_type: s.attendance_type ?? "P",
          notes: s.attendance_note ?? "",
        };
      });
      setAttendance(init);
      setLoaded(true);
    } catch {
      setError("Failed to load students.");
    }
  };

  const setType = (studentId: number, type: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], attendance_type: type } }));
  };

  const setNote = (studentId: number, note: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], notes: note } }));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setError("");
      await apiPost("/api/v1/attendance/student-attendance/store/", {
        class_id: Number(classId),
        section_id: Number(sectionId),
        academic_year_id: academicYearId ? Number(academicYearId) : null,
        date: attendanceDate,
        id: students.map((s) => s.id),
        attendance: Object.fromEntries(
          Object.values(attendance).map((a) => [String(a.student_id), a.attendance_type])
        ),
        note: Object.fromEntries(
          Object.values(attendance).map((a) => [String(a.student_id), a.notes])
        ),
        mark_holiday: markHoliday,
      });
      await searchStudents();
    } catch {
      setError("Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const triggerHoliday = async (purpose: "mark" | "unmark") => {
    if (!classId || !sectionId || !attendanceDate) return;
    try {
      await apiPost("/api/v1/attendance/student-attendance/holiday/", {
        class_id: Number(classId),
        section_id: Number(sectionId),
        attendance_date: attendanceDate,
        academic_year_id: academicYearId ? Number(academicYearId) : null,
        purpose,
      });
      await searchStudents();
    } catch {
      setError("Unable to update holiday status.");
    }
  };

  const loadReport = async () => {
    if (!classId || !sectionId || !reportMonth || !reportYear) {
      setError("Class, section, month and year are required for report.");
      return;
    }
    try {
      const data = await apiGet<MonthlyReport[]>(
        `/api/v1/attendance/student-attendance/report/?class_id=${classId}&section_id=${sectionId}&month=${reportMonth}&year=${reportYear}`
      );
      setReport(data);
      setReportLoaded(true);
    } catch {
      setError("Failed to load attendance report.");
    }
  };

  const typeColor: Record<string, string> = { P: "#16a34a", A: "#dc2626", L: "#d97706", F: "#2563eb", H: "#6b7280" };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Student Attendance" />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">

          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Search Students</div>
              <Link href="/attendance/student/import" style={{ textDecoration: "none" }}>
                <button type="button" style={btnStyle()}>Import Attendance</button>
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} style={fieldStyle()}>
                <option value="">Academic year</option>
                {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); setLoaded(false); setStudents([]); }} style={fieldStyle()}>
                <option value="">Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => { setSectionId(e.target.value); setLoaded(false); setStudents([]); }} style={fieldStyle()}>
                <option value="">Section</option>
                {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={fieldStyle()} />
              <button type="button" onClick={() => void searchStudents()} style={btnStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          {loaded && (
            <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>Mark Attendance — {attendanceDate}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" checked={markHoliday} onChange={(e) => setMarkHoliday(e.target.checked)} />
                    Mark All Holiday
                  </label>
                  <button type="button" onClick={() => void triggerHoliday("mark")} style={btnStyle("#6b7280")}>Holiday Day</button>
                  <button type="button" onClick={() => void triggerHoliday("unmark")} style={btnStyle("#6b7280")}>Unmark Holiday</button>
                  <button type="button" disabled={saving} onClick={() => void saveAttendance()} style={btnStyle()}>{saving ? "Saving..." : "Save Attendance"}</button>
                </div>
              </div>
              {attendanceTypeBanner === "H" && <div style={{ background: "#fff8e1", border: "1px solid #fbbf24", padding: 8, borderRadius: 8, marginBottom: 8 }}>Attendance already submitted as Holiday.</div>}
              {attendanceTypeBanner && attendanceTypeBanner !== "H" && <div style={{ background: "#ecfdf5", border: "1px solid #10b981", padding: 8, borderRadius: 8, marginBottom: 8 }}>Attendance already submitted.</div>}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Roll Number</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const entry = attendance[student.id];
                    const curType = entry?.attendance_type ?? "P";
                    return (
                      <tr key={student.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 140 }}>{student.admission_no}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.first_name} {student.last_name}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.roll_no || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 280 }}>
                          {(["P", "L", "A", "F"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setType(student.id, type)}
                              style={{
                                marginRight: 4,
                                padding: "4px 12px",
                                border: `1px solid ${typeColor[type]}`,
                                background: curType === type ? typeColor[type] : "#fff",
                                color: curType === type ? "#fff" : typeColor[type],
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {type === "P" ? "Present" : type === "A" ? "Absent" : type === "L" ? "Late" : "Half Day"}
                            </button>
                          ))}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <input
                            value={entry?.notes ?? ""}
                            onChange={(e) => setNote(student.id, e.target.value)}
                            placeholder="Note"
                            style={{ ...fieldStyle(), height: 30, width: "100%" }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 8, color: "var(--text-muted)" }}>No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="white-box" style={boxStyle()}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Monthly Attendance Report</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} style={{ ...fieldStyle(), width: 140 }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
              <input type="number" value={reportYear} onChange={(e) => setReportYear(e.target.value)} placeholder="Year" style={{ ...fieldStyle(), width: 120 }} />
              <button type="button" onClick={() => void loadReport()} style={btnStyle()}>Generate Report</button>
            </div>
            {reportLoaded && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.P }}>Present</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.A }}>Absent</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.L }}>Late</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.F }}>Half Day</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.H }}>Holiday</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.student_id}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.P, fontWeight: 600 }}>{row.present}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.A, fontWeight: 600 }}>{row.absent}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.L, fontWeight: 600 }}>{row.late}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.F, fontWeight: 600 }}>{row.half_day}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", color: typeColor.H, fontWeight: 600 }}>{row.holiday}</td>
                    </tr>
                  ))}
                  {report.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 8, color: "var(--text-muted)" }}>No attendance data for selected period.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
