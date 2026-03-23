"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type StudentRow = {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string | null;
  gender: "male" | "female" | "other";
  category?: number | null;
  guardian?: number | null;
  current_class?: number | null;
  current_section?: number | null;
  is_active: boolean;
};

type Guardian = { id: number; full_name: string; phone: string };
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

function fullName(row: StudentRow) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-";
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

export function StudentUnassignedPanel() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [categories, setCategories] = useState<StudentCategory[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentData, guardianData, categoryData] = await Promise.all([
        apiGet<ApiList<StudentRow>>("/api/v1/students/students/"),
        apiGet<ApiList<Guardian>>("/api/v1/students/guardians/"),
        apiGet<ApiList<StudentCategory>>("/api/v1/students/categories/"),
      ]);
      setStudents(listData(studentData));
      setGuardians(listData(guardianData));
      setCategories(listData(categoryData));
    } catch {
      setError("Unable to load unassigned students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const guardianMap = useMemo(() => new Map(guardians.map((item) => [item.id, item])), [guardians]);
  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((row) => {
      const isUnassigned = !row.current_class || !row.current_section;
      if (!isUnassigned || !row.is_active) {
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
  }, [students, search]);

  const deleteStudent = async (id: number, name: string) => {
    const yes = window.confirm(`Move ${name} to deleted records?`);
    if (!yes) {
      return;
    }
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiPatch(`/api/v1/students/students/${id}/`, { is_active: false });
      setStudents((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: false } : item)));
      setSuccess("Student moved to deleted records.");
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
            <h1 style={{ margin: 0, fontSize: 24 }}>Unassigned Student</h1>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/students/multi-class" style={{ ...buttonStyle("#16a34a"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Multi Class Student
                </Link>
                <Link href="/students/delete-record" style={{ ...buttonStyle("#dc2626"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Delete Student Record
                </Link>
              </div>
              <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
                <span>Dashboard</span>
                <span>/</span>
                <span>Student Information</span>
                <span>/</span>
                <span>Unassigned Student</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by admission, roll, name"
              style={fieldStyle()}
            />
          </div>

          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Unassigned Student List</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Guardian</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Date Of Birth</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Gender</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Phone</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 12, color: "var(--text-muted)" }}>
                        No unassigned students found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const guardian = row.guardian ? guardianMap.get(row.guardian) : null;
                      const categoryName = row.category ? categoryMap.get(row.category) : null;
                      return (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{fullName(row)}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{guardian?.full_name || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{formatDate(row.date_of_birth)}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.gender || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{categoryName || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{guardian?.phone || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <Link
                                href={`/students/multi-class?student=${row.id}`}
                                style={{ ...buttonStyle("#0284c7"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                              >
                                Assign Class
                              </Link>
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

            {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading unassigned students...</p>}
            {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
            {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
