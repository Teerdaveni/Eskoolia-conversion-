"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type StudentRow = {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other";
  category?: number | null;
  guardian?: number | null;
  current_class?: number | null;
  current_section?: number | null;
  is_disabled: boolean;
  is_active: boolean;
};

type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };
type Guardian = { id: number; full_name: string; phone?: string };
type StudentCategory = { id: number; name: string };

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<void>(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
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

function fullName(student: StudentRow) {
  return `${student.first_name || ""} ${student.last_name || ""}`.trim() || "-";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

export function StudentDisabledPanel() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [categories, setCategories] = useState<StudentCategory[]>([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [admissionQuery, setAdmissionQuery] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentData, classData, sectionData, guardianData, categoryData] = await Promise.all([
        apiGet<ApiList<StudentRow>>("/api/v1/students/students/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        apiGet<ApiList<Guardian>>("/api/v1/students/guardians/"),
        apiGet<ApiList<StudentCategory>>("/api/v1/students/categories/"),
      ]);
      setStudents(listData(studentData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
      setGuardians(listData(guardianData));
      setCategories(listData(categoryData));
    } catch {
      setError("Unable to load disabled students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item.name])), [classes]);
  const sectionMap = useMemo(() => new Map(sections.map((item) => [item.id, item.name])), [sections]);
  const guardianMap = useMemo(() => new Map(guardians.map((item) => [item.id, item])), [guardians]);
  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);

  const filteredSections = useMemo(() => {
    if (!classId) {
      return sections;
    }
    return sections.filter((item) => String(item.school_class) === classId);
  }, [sections, classId]);

  const filteredRows = useMemo(() => {
    const name = nameQuery.trim().toLowerCase();
    const admission = admissionQuery.trim().toLowerCase();

    return students.filter((row) => {
      if (!row.is_disabled) {
        return false;
      }
      if (classId && String(row.current_class || "") !== classId) {
        return false;
      }
      if (sectionId && String(row.current_section || "") !== sectionId) {
        return false;
      }
      if (name && !fullName(row).toLowerCase().includes(name)) {
        return false;
      }
      if (admission && !(row.admission_no || "").toLowerCase().includes(admission)) {
        return false;
      }
      return true;
    });
  }, [students, classId, sectionId, nameQuery, admissionQuery]);

  const enableStudent = async (id: number) => {
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiPatch(`/api/v1/students/students/${id}/`, { is_disabled: false, is_active: true });
      setStudents((prev) => prev.map((row) => (row.id === id ? { ...row, is_disabled: false, is_active: true } : row)));
      setSuccess("Student enabled successfully.");
    } catch {
      setError("Unable to enable student.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteStudent = async (id: number, name: string) => {
    const yes = window.confirm(`You are going to remove ${name}. Removed data cannot be restored. Continue?`);
    if (!yes) {
      return;
    }

    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/students/students/${id}/`);
      setStudents((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Student deleted successfully.");
    } catch {
      setError("Unable to delete student.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Disabled Students</h1>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/students/list" style={{ ...buttonStyle("#0ea5e9"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Student List
                </Link>
                <button type="button" onClick={() => void load()} style={buttonStyle()}>
                  Refresh
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
                <span>Dashboard</span>
                <span>/</span>
                <span>Student Information</span>
                <span>/</span>
                <span>Disabled Students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(160px, 1fr))", gap: 8 }}>
              <select value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} style={fieldStyle()}>
                <option value="">Select Section</option>
                {filteredSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Search by name" style={fieldStyle()} />
              <input value={admissionQuery} onChange={(event) => setAdmissionQuery(event.target.value)} placeholder="Search by admission no" style={fieldStyle()} />
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Disabled Students</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Father/Guardian</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Date Of Birth</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Gender</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Phone</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 12, color: "var(--text-muted)" }}>
                        No disabled students found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const className = classMap.get(row.current_class || 0) || "-";
                      const sectionName = sectionMap.get(row.current_section || 0);
                      const guardian = row.guardian ? guardianMap.get(row.guardian) : undefined;
                      const categoryName = row.category ? categoryMap.get(row.category) : undefined;

                      return (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{fullName(row)}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            {className}{sectionName ? ` (${sectionName})` : ""}
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{guardian?.full_name || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{formatDate(row.date_of_birth)}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.gender || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{categoryName || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{guardian?.phone || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button type="button" disabled={busyId === row.id} style={buttonStyle("#0284c7")} onClick={() => void enableStudent(row.id)}>
                                Enable
                              </button>
                              <button
                                type="button"
                                disabled={busyId === row.id}
                                style={buttonStyle("#dc2626")}
                                onClick={() => void deleteStudent(row.id, fullName(row))}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading disabled students...</p>}
            {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
            {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
