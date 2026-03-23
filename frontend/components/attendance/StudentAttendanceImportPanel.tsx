"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type SchoolClass = { id: number; class_name?: string; name?: string };
type Section = { id: number; school_class: number; name: string };

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function buttonStyle() {
  return { height: 36, padding: "0 14px", border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", borderRadius: 8, cursor: "pointer" } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

export default function StudentAttendanceImportPanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [classData, sectionData] = await Promise.all([
        apiGet<{ classes: SchoolClass[] }>("/api/v1/attendance/student-attendance/import/"),
        apiGet<Section[] | { results?: Section[] }>("/api/v1/core/sections/"),
      ]);
      setClasses(classData.classes || []);
      setSections(Array.isArray(sectionData) ? sectionData : sectionData.results || []);
    };
    void load();
  }, []);

  const filteredSections = useMemo(() => {
    const id = Number(classId);
    if (!id) return [];
    return sections.filter((s) => s.school_class === id);
  }, [classId, sections]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!classId || !sectionId || !attendanceDate || !file) {
      setError("Class, section, attendance date and file are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("class", classId);
      formData.append("section", sectionId);
      formData.append("attendance_date", attendanceDate);
      formData.append("file", file);

      await apiRequestWithRefresh("/api/v1/attendance/student-attendance/bulk-store/", {
        method: "POST",
        headers: {},
        body: formData,
      });
      setMessage("Operation successful");
    } catch {
      setError("Operation Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Student Attendance</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span><span>/</span><span>Student Attendance</span><span>/</span><span>Student Attendance Import</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Select Criteria</h3>
            <Link href={`${API_BASE_URL}/api/v1/attendance/student-attendance/download-sample/`} target="_blank" style={{ textDecoration: "none" }}>
              <button type="button" style={buttonStyle()}>Download Sample File</button>
            </Link>
          </div>

          <div className="white-box" style={boxStyle()}>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.class_name || schoolClass.name || `Class ${schoolClass.id}`}</option>
                ))}
              </select>

              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Section *</option>
                {filteredSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>

              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={fieldStyle()} />
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: "6px 10px" }} />

              <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: 10 }}>
                <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Importing..." : "Import Attendance"}</button>
              </div>
            </form>
            {error && <p style={{ color: "var(--warning)", marginTop: 10 }}>{error}</p>}
            {message && <p style={{ color: "#10b981", marginTop: 10 }}>{message}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}