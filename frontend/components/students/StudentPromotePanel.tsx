"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type AcademicYear = { id: number; name: string; is_current?: boolean };
type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };

type StudentRow = {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  current_class?: number | null;
  current_section?: number | null;
  is_active: boolean;
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

function fieldStyle() {
  return {
    width: "100%",
    height: 36,
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "0 10px",
  } as const;
}

function btnStyle(color = "var(--primary)") {
  return {
    height: 36,
    padding: "0 14px",
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
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

function fullName(row: StudentRow) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-";
}

export function StudentPromotePanel() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [currentYearId, setCurrentYearId] = useState("");
  const [currentClassId, setCurrentClassId] = useState("");
  const [currentSectionId, setCurrentSectionId] = useState("");

  const [promoteYearId, setPromoteYearId] = useState("");
  const [promoteClassId, setPromoteClassId] = useState("");
  const [promoteSectionId, setPromoteSectionId] = useState("");

  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCriteria(true);
        setError("");
        const [yearData, classData, sectionData] = await Promise.all([
          apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
          apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
          apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        ]);
        const loadedYears = listData(yearData);
        setYears(loadedYears);
        setClasses(listData(classData));
        setSections(listData(sectionData));

        const current = loadedYears.find((item) => item.is_current);
        if (current) {
          setCurrentYearId(String(current.id));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        setError(message && message !== "401" ? message : "Unable to load promote criteria.");
      } finally {
        setLoadingCriteria(false);
      }
    };
    void load();
  }, []);

  const currentSections = useMemo(() => {
    if (!currentClassId) return [];
    return sections.filter((item) => Number(item.school_class) === Number(currentClassId));
  }, [sections, currentClassId]);

  const promoteSections = useMemo(() => {
    if (!promoteClassId) return [];
    return sections.filter((item) => Number(item.school_class) === Number(promoteClassId));
  }, [sections, promoteClassId]);

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item.name])), [classes]);
  const sectionMap = useMemo(() => new Map(sections.map((item) => [item.id, item.name])), [sections]);

  const searchedRows = useMemo(() => {
    return students.filter((row) => {
      if (!row.is_active) {
        return false;
      }
      if (currentClassId && String(row.current_class || "") !== currentClassId) {
        return false;
      }
      if (currentSectionId && String(row.current_section || "") !== currentSectionId) {
        return false;
      }
      return true;
    });
  }, [students, currentClassId, currentSectionId]);

  const selectedIds = useMemo(
    () => Object.entries(checked).filter(([, value]) => value).map(([id]) => Number(id)),
    [checked],
  );

  const search = async () => {
    if (!currentClassId || !currentSectionId) {
      setError("Select current class and section to search students.");
      return;
    }

    try {
      setLoadingStudents(true);
      setError("");
      setSuccess("");
      const data = await apiGet<ApiList<StudentRow>>("/api/v1/students/students/?is_active=true");
      const rows = listData(data);
      setStudents(rows);
      const init: Record<number, boolean> = {};
      rows.forEach((row) => {
        init[row.id] = false;
      });
      setChecked(init);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message && message !== "401" ? message : "Unable to fetch students for promotion.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const setAll = (value: boolean) => {
    const next: Record<number, boolean> = {};
    searchedRows.forEach((row) => {
      next[row.id] = value;
    });
    setChecked((prev) => ({ ...prev, ...next }));
  };

  const promote = async () => {
    if (!selectedIds.length) {
      setError("Select at least one student to promote.");
      return;
    }
    if (!promoteClassId) {
      setError("Select promote class.");
      return;
    }
    if (!promoteYearId) {
      setError("Select promote academic year.");
      return;
    }

    try {
      setPromoting(true);
      setError("");
      setSuccess("");

      const payload = {
        student_ids: selectedIds,
        to_class: Number(promoteClassId),
        to_section: promoteSectionId ? Number(promoteSectionId) : null,
        to_academic_year: Number(promoteYearId),
        note: "Promoted from Student Promote panel",
      };

      const result = await apiPost<{ promoted: number }>("/api/v1/students/students/promote/", payload);
      setSuccess(`${result.promoted || 0} student(s) promoted successfully.`);
      await search();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message && message !== "401" ? message : "Unable to promote selected students.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Student Promote</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Student Information</span>
              <span>/</span>
              <span>Student Promote</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr)) auto", gap: 8 }}>
              <select value={currentYearId} onChange={(e) => setCurrentYearId(e.target.value)} style={fieldStyle()} disabled={loadingCriteria}>
                <option value="">Current Academic Year</option>
                {years.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select value={currentClassId} onChange={(e) => { setCurrentClassId(e.target.value); setCurrentSectionId(""); }} style={fieldStyle()}>
                <option value="">Current Class *</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select value={currentSectionId} onChange={(e) => setCurrentSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">Current Section *</option>
                {currentSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div />
              <button type="button" onClick={() => void search()} style={btnStyle()} disabled={loadingStudents}>
                {loadingStudents ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Promote Student In Next Session</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left", width: 80 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="checkbox" onChange={(e) => setAll(e.target.checked)} checked={searchedRows.length > 0 && selectedIds.length === searchedRows.length} />
                        All
                      </label>
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Admission No</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Class/Section</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Name</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Current Result</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 12, color: "var(--text-muted)" }}>
                        No students found for selected criteria.
                      </td>
                    </tr>
                  ) : (
                    searchedRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <input
                            type="checkbox"
                            checked={!!checked[row.id]}
                            onChange={(e) => setChecked((prev) => ({ ...prev, [row.id]: e.target.checked }))}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          {(classMap.get(row.current_class || 0) || "-") + (row.current_section ? ` (${sectionMap.get(row.current_section) || "-"})` : "")}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{fullName(row)}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>N/A</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 8, marginTop: 12 }}>
              <select value={promoteYearId} onChange={(e) => setPromoteYearId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Academic Year *</option>
                {years
                  .filter((item) => !currentYearId || String(item.id) !== currentYearId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>

              <select value={promoteClassId} onChange={(e) => { setPromoteClassId(e.target.value); setPromoteSectionId(""); }} style={fieldStyle()}>
                <option value="">Select Class *</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select value={promoteSectionId} onChange={(e) => setPromoteSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">Select Section</option>
                {promoteSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <button type="button" onClick={() => void promote()} style={btnStyle("#16a34a")} disabled={promoting}>
                {promoting ? "Promoting..." : "Promote"}
              </button>
            </div>
          </div>

          {error && <p style={{ margin: 0, color: "var(--warning)" }}>{error}</p>}
          {success && <p style={{ margin: 0, color: "#0f766e" }}>{success}</p>}
        </div>
      </section>
    </div>
  );
}
