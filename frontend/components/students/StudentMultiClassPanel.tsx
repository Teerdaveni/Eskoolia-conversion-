"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type Student = {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  current_class?: number | null;
  current_section?: number | null;
  is_active: boolean;
};

type SchoolClass = {
  id: number;
  name: string;
};

type Section = {
  id: number;
  school_class: number;
  name: string;
};

type MultiRecord = {
  id?: number;
  school_class: number | "";
  section: number | "";
  roll_no: string;
  is_default: boolean;
};

type MultiRecordApi = {
  id: number;
  student: number;
  school_class: number;
  section: number | null;
  roll_no: string;
  is_default: boolean;
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

function studentName(row: Student) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || `Student #${row.id}`;
}

function toUiRecord(rows: MultiRecordApi[]): MultiRecord[] {
  if (!rows.length) {
    return [];
  }
  return rows.map((row) => ({
    id: row.id,
    school_class: row.school_class,
    section: row.section ?? "",
    roll_no: row.roll_no || "",
    is_default: row.is_default,
  }));
}

export function StudentMultiClassPanel() {
  const searchParams = useSearchParams();
  const studentFromQuery = searchParams.get("student") || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchName, setSearchName] = useState("");
  const [searchRoll, setSearchRoll] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  const [studentRecords, setStudentRecords] = useState<Record<number, MultiRecord[]>>({});

  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentData, classData, sectionData] = await Promise.all([
        apiGet<ApiList<Student>>("/api/v1/students/students/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
      ]);
      setStudents(listData(studentData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
    } catch {
      setError("Unable to load multi-class data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBaseData();
  }, []);

  const filteredSections = useMemo(() => {
    if (!filterClassId) {
      return sections;
    }
    return sections.filter((item) => String(item.school_class) === filterClassId);
  }, [filterClassId, sections]);

  const filteredStudents = useMemo(() => {
    const byName = searchName.trim().toLowerCase();
    const byRoll = searchRoll.trim().toLowerCase();
    const byStudentId = studentFromQuery.trim();

    return students.filter((row) => {
      if (!row.is_active) {
        return false;
      }

      if (byStudentId && String(row.id) !== byStudentId) {
        return false;
      }

      if (filterClassId && String(row.current_class || "") !== filterClassId) {
        return false;
      }
      if (filterSectionId && String(row.current_section || "") !== filterSectionId) {
        return false;
      }

      if (byName && !studentName(row).toLowerCase().includes(byName)) {
        return false;
      }
      if (byRoll && !(row.roll_no || "").toLowerCase().includes(byRoll)) {
        return false;
      }

      return true;
    });
  }, [students, searchName, searchRoll, filterClassId, filterSectionId, studentFromQuery]);

  const classNameById = useMemo(() => {
    return new Map(classes.map((item) => [item.id, item.name]));
  }, [classes]);

  const sectionNameById = useMemo(() => {
    return new Map(sections.map((item) => [item.id, item.name]));
  }, [sections]);

  const loadStudentRecords = async (studentId: number) => {
    const data = await apiGet<ApiList<MultiRecordApi>>(`/api/v1/students/multi-class-records/?student=${studentId}`);
    setStudentRecords((prev) => ({
      ...prev,
      [studentId]: toUiRecord(listData(data)),
    }));
  };

  const ensureStudentRecords = async (studentId: number) => {
    if (studentRecords[studentId]) {
      return;
    }
    try {
      await loadStudentRecords(studentId);
    } catch {
      setError("Unable to load student linked class records.");
    }
  };

  const addRecord = (studentId: number) => {
    setStudentRecords((prev) => {
      const rows = prev[studentId] || [];
      return {
        ...prev,
        [studentId]: [...rows, { school_class: "", section: "", roll_no: "", is_default: rows.length === 0 }],
      };
    });
  };

  const updateRecord = (studentId: number, index: number, patch: Partial<MultiRecord>) => {
    setStudentRecords((prev) => {
      const rows = [...(prev[studentId] || [])];
      const old = rows[index];
      if (!old) {
        return prev;
      }
      let next = { ...old, ...patch };

      if (patch.school_class !== undefined) {
        const sectionId = Number(next.section || 0);
        if (sectionId) {
          const selectedSection = sections.find((item) => item.id === sectionId);
          if (!selectedSection || selectedSection.school_class !== Number(next.school_class || 0)) {
            next = { ...next, section: "" };
          }
        }
      }

      rows[index] = next;
      return { ...prev, [studentId]: rows };
    });
  };

  const setDefaultRecord = (studentId: number, index: number) => {
    setStudentRecords((prev) => {
      const rows = [...(prev[studentId] || [])].map((item, i) => ({ ...item, is_default: i === index }));
      return { ...prev, [studentId]: rows };
    });
  };

  const removeRecord = (studentId: number, index: number) => {
    setStudentRecords((prev) => {
      const rows = [...(prev[studentId] || [])];
      rows.splice(index, 1);
      if (rows.length && !rows.some((item) => item.is_default)) {
        rows[0] = { ...rows[0], is_default: true };
      }
      return { ...prev, [studentId]: rows };
    });
  };

  const saveStudentRecords = async (studentId: number) => {
    const rows = studentRecords[studentId] || [];
    if (!rows.length) {
      setError("Add at least one class record before update.");
      return;
    }

    for (const row of rows) {
      if (!row.school_class) {
        setError("Class is required for each linked row.");
        return;
      }
      if (!row.section) {
        setError("Section is required for each linked row.");
        return;
      }
    }

    try {
      setSavingStudentId(studentId);
      setError("");
      setSuccess("");

      const payload = {
        student_id: studentId,
        records: rows.map((row, index) => ({
          school_class: Number(row.school_class),
          section: Number(row.section),
          roll_no: row.roll_no || "",
          is_default: row.is_default || index === 0,
        })),
      };

      const response = await apiPost<{ student_id: number; records: MultiRecordApi[] }>(
        "/api/v1/students/multi-class-records/bulk-save/",
        payload,
      );

      setStudentRecords((prev) => ({
        ...prev,
        [studentId]: toUiRecord(response.records),
      }));

      const defaultRecord = response.records.find((item) => item.is_default) || response.records[0];
      if (defaultRecord) {
        setStudents((prev) =>
          prev.map((item) =>
            item.id === studentId
              ? {
                  ...item,
                  current_class: defaultRecord.school_class,
                  current_section: defaultRecord.section,
                }
              : item,
          ),
        );
      }

      setSuccess("Student multi class records updated.");
    } catch {
      setError("Unable to update multi class records.");
    } finally {
      setSavingStudentId(null);
    }
  };

  const sectionsForClass = (classId: number | "") => {
    if (!classId) {
      return [];
    }
    return sections.filter((item) => item.school_class === Number(classId));
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Multi Class Student</h1>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/students/add" style={{ ...buttonStyle("#16a34a"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Add Student
                </Link>
                <Link href="/students/list" style={{ ...buttonStyle("#0ea5e9"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Student List
                </Link>
                <Link href="/students/delete-record" style={{ ...buttonStyle("#dc2626"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  Delete Record
                </Link>
              </div>
              <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
                <span>Dashboard</span>
                <span>/</span>
                <span>Student Information</span>
                <span>/</span>
                <span>Multi Class Student</span>
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
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Class</label>
                <select value={filterClassId} onChange={(event) => { setFilterClassId(event.target.value); setFilterSectionId(""); }} style={fieldStyle()}>
                  <option value="">All Classes</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Section</label>
                <select value={filterSectionId} onChange={(event) => setFilterSectionId(event.target.value)} style={fieldStyle()}>
                  <option value="">All Sections</option>
                  {filteredSections.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Search By Name</label>
                <input value={searchName} onChange={(event) => setSearchName(event.target.value)} style={fieldStyle()} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Search By Roll No</label>
                <input value={searchRoll} onChange={(event) => setSearchRoll(event.target.value)} style={fieldStyle()} />
              </div>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {filteredStudents.map((student) => {
                const rows = studentRecords[student.id] || [];
                return (
                  <div key={student.id} style={{ border: "1px solid var(--line)", borderRadius: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 100%)",
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        color: "#fff",
                      }}
                    >
                      <div>
                        <strong>{studentName(student)}</strong> {student.admission_no ? `(${student.admission_no})` : ""}
                      </div>
                      <button
                        type="button"
                        style={buttonStyle("#16a34a")}
                        onClick={() => {
                          void ensureStudentRecords(student.id);
                          addRecord(student.id);
                        }}
                      >
                        Add
                      </button>
                    </div>

                    <div style={{ padding: 12, display: "grid", gap: 8, minHeight: 200 }}>
                      {rows.length === 0 ? (
                        <div style={{ color: "var(--text-muted)" }}>
                          <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void ensureStudentRecords(student.id)}>
                            Load Records
                          </button>
                        </div>
                      ) : (
                        rows.map((row, idx) => {
                          const rowSections = sectionsForClass(row.school_class);
                          return (
                            <div key={`${student.id}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 8, alignItems: "center" }}>
                              <select
                                value={row.school_class}
                                onChange={(event) => updateRecord(student.id, idx, { school_class: Number(event.target.value) || "" })}
                                style={fieldStyle()}
                              >
                                <option value="">Class *</option>
                                {classes.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={row.section}
                                onChange={(event) => updateRecord(student.id, idx, { section: Number(event.target.value) || "" })}
                                style={fieldStyle()}
                              >
                                <option value="">Section *</option>
                                {rowSections.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>

                              <input
                                value={row.roll_no}
                                onChange={(event) => updateRecord(student.id, idx, { roll_no: event.target.value })}
                                style={{ ...fieldStyle(), width: 90 }}
                                placeholder="Roll"
                              />

                              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                <input
                                  type="checkbox"
                                  checked={row.is_default}
                                  onChange={() => setDefaultRecord(student.id, idx)}
                                />
                                Default
                              </label>

                              <button type="button" style={buttonStyle("#dc2626")} onClick={() => removeRecord(student.id, idx)}>
                                Delete
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ padding: "0 12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        Current: {classNameById.get(student.current_class || 0) || "-"} / {sectionNameById.get(student.current_section || 0) || "-"}
                      </div>
                      <button
                        type="button"
                        style={buttonStyle()}
                        disabled={savingStudentId === student.id}
                        onClick={() => void saveStudentRecords(student.id)}
                      >
                        {savingStudentId === student.id ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && <p style={{ margin: 0, color: "var(--text-muted)" }}>Loading data...</p>}
          {error && <p style={{ margin: 0, color: "var(--warning)" }}>{error}</p>}
          {success && <p style={{ margin: 0, color: "#0f766e" }}>{success}</p>}
        </div>
      </section>
    </div>
  );
}
