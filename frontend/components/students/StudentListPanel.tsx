"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type SchoolClass = {
  id: number;
  name: string;
};

type Section = {
  id: number;
  school_class: number;
  name: string;
};

type StudentRow = {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  gender: "male" | "female" | "other";
  blood_group?: string;
  category?: number | null;
  guardian?: number | null;
  current_class?: number | null;
  current_section?: number | null;
  is_disabled: boolean;
  is_active: boolean;
  created_at: string;
};

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
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

export function StudentListPanel() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((section) => String(section.school_class) === classId);
  }, [sections, classId]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentData, classData, sectionData] = await Promise.all([
        apiGet<ApiList<StudentRow>>("/api/v1/students/students/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
      ]);
      setRows(listData(studentData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
    } catch {
      setError("Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (onlyActive && !row.is_active) {
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
      const name = `${row.first_name || ""} ${row.last_name || ""}`.trim().toLowerCase();
      return (
        (row.roll_no || "").toLowerCase().includes(q) ||
        name.includes(q)
      );
    });
  }, [rows, search, onlyActive, classId, sectionId]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Student List</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Student Information</span>
              <span>/</span>
              <span>Student List</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto auto", gap: 8 }}>
              <select
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setSectionId("");
                }}
                style={fieldStyle()}
              >
                <option value="">Select Class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
                style={fieldStyle()}
                disabled={!classId}
              >
                <option value="">Select Section</option>
                {filteredSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or roll no"
                style={fieldStyle()}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} />
                Active Only
              </label>
              <button
                type="button"
                onClick={() => {
                  setClassId("");
                  setSectionId("");
                  setSearch("");
                  setOnlyActive(true);
                }}
                style={buttonStyle("#6b7280")}
              >
                Reset
              </button>
              <button type="button" onClick={() => void load()} style={buttonStyle()}>
                Refresh
              </button>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Student List</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>SL</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll No</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Gender</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 12, color: "var(--text-muted)" }}>
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, index) => (
                      <tr key={row.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{index + 1}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          {`${row.first_name || ""} ${row.last_name || ""}`.trim() || "-"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.gender || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{classes.find((item) => item.id === row.current_class)?.name || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{sections.find((item) => item.id === row.current_section)?.name || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          {row.is_active ? (row.is_disabled ? "Disabled" : "Active") : "Inactive"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading students...</p>}
            {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
