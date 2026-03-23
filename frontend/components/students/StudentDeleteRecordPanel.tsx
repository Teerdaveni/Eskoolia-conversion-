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
  current_class?: number | null;
  current_section?: number | null;
  guardian?: number | null;
  is_active: boolean;
};

type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };
type Guardian = { id: number; phone: string; full_name: string };

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

function fullName(row: StudentRow) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-";
}

export function StudentDeleteRecordPanel() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [deletedOnly, setDeletedOnly] = useState(true);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentData, classData, sectionData, guardianData] = await Promise.all([
        apiGet<ApiList<StudentRow>>("/api/v1/students/students/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        apiGet<ApiList<Guardian>>("/api/v1/students/guardians/"),
      ]);
      setStudents(listData(studentData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
      setGuardians(listData(guardianData));
    } catch {
      setError("Unable to load student records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sectionOptions = useMemo(() => {
    if (!classId) {
      return sections;
    }
    return sections.filter((item) => String(item.school_class) === classId);
  }, [sections, classId]);

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item.name])), [classes]);
  const sectionMap = useMemo(() => new Map(sections.map((item) => [item.id, item.name])), [sections]);
  const guardianMap = useMemo(() => new Map(guardians.map((item) => [item.id, item])), [guardians]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((row) => {
      if (deletedOnly && row.is_active) {
        return false;
      }
      if (classId && String(row.current_class || "") !== classId) {
        return false;
      }
      if (sectionId && String(row.current_section || "") !== sectionId) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        (row.admission_no || "").toLowerCase().includes(q) ||
        (row.roll_no || "").toLowerCase().includes(q) ||
        fullName(row).toLowerCase().includes(q)
      );
    });
  }, [students, search, classId, sectionId, deletedOnly]);

  const restore = async (id: number) => {
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiPatch(`/api/v1/students/students/${id}/`, { is_active: true });
      setStudents((prev) => prev.map((row) => (row.id === id ? { ...row, is_active: true } : row)));
      setSuccess("Student record restored.");
    } catch {
      setError("Unable to restore student record.");
    } finally {
      setBusyId(null);
    }
  };

  const moveToDeleted = async (id: number) => {
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiPatch(`/api/v1/students/students/${id}/`, { is_active: false });
      setStudents((prev) => prev.map((row) => (row.id === id ? { ...row, is_active: false } : row)));
      setSuccess("Student moved to delete record list.");
    } catch {
      setError("Unable to mark student as deleted record.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteForever = async (id: number, name: string) => {
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
      setSuccess("Student record deleted permanently.");
    } catch {
      setError("Unable to delete student record permanently.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Delete Student Record</h1>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/students/list" style={{ ...buttonStyle("#0ea5e9"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Student List
                </Link>
                <Link href="/students/multi-class" style={{ ...buttonStyle("#16a34a"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Multi Class Student
                </Link>
              </div>
              <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
                <span>Dashboard</span>
                <span>/</span>
                <span>Student Information</span>
                <span>/</span>
                <span>Delete Student Record</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8 }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by admission, roll, name"
                style={fieldStyle()}
              />
              <select value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">All Classes</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {sectionOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={deletedOnly} onChange={(event) => setDeletedOnly(event.target.checked)} />
                Deleted Only
              </label>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Delete Student Record</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class (Section)</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Phone</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Date Of Birth</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 12, color: "var(--text-muted)" }}>
                        No student records found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const guardian = row.guardian ? guardianMap.get(row.guardian) : null;
                      const className = classMap.get(row.current_class || 0) || "-";
                      const sectionName = sectionMap.get(row.current_section || 0);

                      return (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{fullName(row)}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            {className}{sectionName ? ` (${sectionName})` : ""}
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{guardian?.phone || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{formatDate(row.date_of_birth)}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {row.is_active ? (
                                <button type="button" disabled={busyId === row.id} style={buttonStyle("#b45309")} onClick={() => void moveToDeleted(row.id)}>
                                  Move To Deleted
                                </button>
                              ) : (
                                <button type="button" disabled={busyId === row.id} style={buttonStyle("#0284c7")} onClick={() => void restore(row.id)}>
                                  Restore
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={busyId === row.id}
                                style={buttonStyle("#dc2626")}
                                onClick={() => void deleteForever(row.id, fullName(row))}
                              >
                                Delete Forever
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
            {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading records...</p>}
            {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
            {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
