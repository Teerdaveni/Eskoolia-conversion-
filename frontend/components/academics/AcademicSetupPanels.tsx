"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type AcademicYear = { id: number; name: string; is_current: boolean };
type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };
type Subject = { id: number; name: string; code: string };
type Teacher = { id: number; full_name?: string; username: string };
type ClassPeriod = { id: number; period: string; start_time: string; end_time: string };
type ClassRoom = { id: number; room_no: string; capacity: number | null; active_status: boolean };

type ClassTeacherAssignment = {
  id: number;
  academic_year_id: number | null;
  class_id: number;
  section_id: number | null;
  teacher_id: number;
  active_status: boolean;
  school_class?: number;
  section?: number | null;
  teacher?: number | null;
};

type ClassSubjectAssignment = {
  id: number;
  academic_year_id: number | null;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number | null;
  is_optional: boolean;
  active_status: boolean;
  school_class?: number;
  section?: number | null;
  subject?: number | null;
  teacher?: number | null;
};

type ClassRoutineSlot = {
  id: number;
  academic_year_id: number | null;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number | null;
  day: string;
  class_period_id: number | null;
  start_time: string;
  end_time: string;
  room_id: number | null;
  room: string;
  is_break: boolean;
  active_status: boolean;
  school_class?: number;
  section?: number | null;
  subject?: number | null;
  teacher?: number | null;
};

type LookupBundle = {
  years: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
  periods: ClassPeriod[];
  rooms: ClassRoom[];
};

type ApiList<T> = T[] | { results?: T[] };

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
}

function asList<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

function toId(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function useLookupData() {
  const [data, setData] = useState<LookupBundle>({
    years: [],
    classes: [],
    sections: [],
    subjects: [],
    teachers: [],
    periods: [],
    rooms: [],
  });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [years, classes, sections, subjects, teachers, periods, rooms] = await Promise.all([
        apiFetch<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
        apiFetch<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiFetch<ApiList<Section>>("/api/v1/core/sections/"),
        apiFetch<ApiList<Subject>>("/api/v1/core/subjects/"),
        apiFetch<Teacher[]>("/api/v1/academics/lesson-planners/teachers/"),
        apiFetch<ApiList<ClassPeriod>>("/api/v1/core/class-periods/?period_type=class"),
        apiFetch<ApiList<ClassRoom>>("/api/v1/core/class-rooms/"),
      ]);
      setData({
        years: asList(years),
        classes: asList(classes),
        sections: asList(sections),
        subjects: asList(subjects),
        teachers,
        periods: asList(periods),
        rooms: asList(rooms),
      });
    } catch {
      setError("Unable to load lookup data.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { data, error, reload: load };
}

function nameById<T extends { id: number }>(items: T[], id: number | null | undefined, pick: (item: T) => string): string {
  if (!id) return "-";
  return pick(items.find((entry) => entry.id === id) || ({} as T)) || `#${id}`;
}

function sectionOptionsForClass(sections: Section[], classId: string): Section[] {
  if (!classId) return [];
  const cid = Number(classId);
  return sections.filter((section) => section.school_class === cid);
}

function initialYearId(years: AcademicYear[]): string {
  const current = years.find((year) => year.is_current);
  if (current) return String(current.id);
  return years.length ? String(years[0].id) : "";
}

export function AssignClassTeacherPanel() {
  const { data, error: lookupError } = useLookupData();
  const [items, setItems] = useState<ClassTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  useEffect(() => {
    if (!yearId && data.years.length) {
      setYearId(initialYearId(data.years));
    }
  }, [data.years, yearId]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterClassId) params.set("class_id", filterClassId);
      if (filterSectionId) params.set("section_id", filterSectionId);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await apiFetch<ApiList<ClassTeacherAssignment>>(`/api/v1/academics/class-teachers/${suffix}`);
      setItems(asList(response));
    } catch {
      setError("Unable to load class teacher assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const availableSections = useMemo(() => sectionOptionsForClass(data.sections, classId), [data.sections, classId]);
  const filterSections = useMemo(() => sectionOptionsForClass(data.sections, filterClassId), [data.sections, filterClassId]);

  const resetForm = (clearNotice = true) => {
    setEditingId(null);
    setClassId("");
    setSectionId("");
    setTeacherId("");
    if (clearNotice) {
      setMessage("");
      setError("");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId || !teacherId) {
      setError("Class and class teacher are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        academic_year_id: yearId ? Number(yearId) : null,
        class_id: Number(classId),
        section_id: sectionId ? Number(sectionId) : null,
        teacher_id: Number(teacherId),
        active_status: true,
      };
      await apiFetch(editingId ? `/api/v1/academics/class-teachers/${editingId}/` : "/api/v1/academics/class-teachers/", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(editingId ? "Assignment updated." : "Class teacher assigned.");
      resetForm(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save class teacher assignment.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: ClassTeacherAssignment) => {
    setEditingId(row.id);
    setYearId(row.academic_year_id ? String(row.academic_year_id) : "");
    const mappedClass = toId(row.class_id) ?? toId(row.school_class);
    const mappedSection = toId(row.section_id) ?? toId(row.section);
    const mappedTeacher = toId(row.teacher_id) ?? toId(row.teacher);
    setClassId(mappedClass ? String(mappedClass) : "");
    setSectionId(mappedSection ? String(mappedSection) : "");
    setTeacherId(mappedTeacher ? String(mappedTeacher) : "");
    setMessage("");
    setError("");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this class teacher assignment?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/academics/class-teachers/${id}/`, { method: "DELETE" });
      await load();
    } catch {
      setError("Failed to delete class teacher assignment.");
    }
  };

  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Assign Class Teacher</h1>
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)", padding: 12, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Select Criteria</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
            <select value={filterClassId} onChange={(e) => { setFilterClassId(e.target.value); setFilterSectionId(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
              <option value="">All classes</option>
              {data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section</label>
            <select value={filterSectionId} onChange={(e) => setFilterSectionId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
              <option value="">All sections</option>
              {filterSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => void load()} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Search</button>
          <button type="button" onClick={() => { setFilterClassId(""); setFilterSectionId(""); void load(); }} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto auto", gap: 8, marginBottom: 12, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Academic Year</label>
          <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select year</option>
            {data.years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select class</option>
            {data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">All sections</option>
            {availableSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class Teacher</label>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select teacher</option>
            {data.teachers.map((row) => <option key={row.id} value={row.id}>{row.full_name || row.username}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>{saving ? "..." : editingId ? "Update" : "Assign"}</button>
        {editingId ? <button type="button" onClick={() => resetForm()} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Cancel</button> : null}
      </form>

      {(lookupError || error) && <p style={{ color: "var(--warning)", margin: "8px 0" }}>{lookupError || error}</p>}
      {message && <p style={{ color: "#16a34a", margin: "8px 0" }}>{message}</p>}

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Class</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Section</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Teacher</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={{ padding: 12 }}>Loading...</td></tr> : null}
            {!loading && items.length === 0 ? <tr><td colSpan={4} style={{ padding: 12, color: "var(--text-muted)" }}>No class teacher assignments found.</td></tr> : null}
            {!loading && items.map((row) => {
              const classValue = toId(row.class_id) ?? toId(row.school_class);
              const sectionValue = toId(row.section_id) ?? toId(row.section);
              const teacherValue = toId(row.teacher_id) ?? toId(row.teacher);
              return (
                <tr key={row.id}>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.classes, classValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.sections, sectionValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.teachers, teacherValue, (entry) => entry.full_name || entry.username)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => edit(row)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#0284c7", color: "#fff", cursor: "pointer", fontSize: 12 }}>Edit</button>
                    <button type="button" onClick={() => void remove(row.id)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AssignSubjectPanel() {
  const { data, error: lookupError } = useLookupData();
  const [items, setItems] = useState<ClassSubjectAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  useEffect(() => {
    if (!yearId && data.years.length) {
      setYearId(initialYearId(data.years));
    }
  }, [data.years, yearId]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterClassId) params.set("class_id", filterClassId);
      if (filterSectionId) params.set("section_id", filterSectionId);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await apiFetch<ApiList<ClassSubjectAssignment>>(`/api/v1/academics/class-subjects/${suffix}`);
      setItems(asList(response));
    } catch {
      setError("Unable to load subject assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const availableSections = useMemo(() => sectionOptionsForClass(data.sections, classId), [data.sections, classId]);
  const filterSections = useMemo(() => sectionOptionsForClass(data.sections, filterClassId), [data.sections, filterClassId]);

  const resetForm = (clearNotice = true) => {
    setEditingId(null);
    setClassId("");
    setSectionId("");
    setSubjectId("");
    setTeacherId("");
    setIsOptional(false);
    if (clearNotice) {
      setMessage("");
      setError("");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId || !subjectId) {
      setError("Class and subject are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        academic_year_id: yearId ? Number(yearId) : null,
        class_id: Number(classId),
        section_id: sectionId ? Number(sectionId) : null,
        subject_id: Number(subjectId),
        teacher_id: teacherId ? Number(teacherId) : null,
        is_optional: isOptional,
        active_status: true,
      };
      await apiFetch(editingId ? `/api/v1/academics/class-subjects/${editingId}/` : "/api/v1/academics/class-subjects/", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(editingId ? "Assignment updated." : "Subject assigned.");
      resetForm(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save subject assignment.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: ClassSubjectAssignment) => {
    setEditingId(row.id);
    setYearId(row.academic_year_id ? String(row.academic_year_id) : "");
    const mappedClass = toId(row.class_id) ?? toId(row.school_class);
    const mappedSection = toId(row.section_id) ?? toId(row.section);
    const mappedSubject = toId(row.subject_id) ?? toId(row.subject);
    const mappedTeacher = toId(row.teacher_id) ?? toId(row.teacher);
    setClassId(mappedClass ? String(mappedClass) : "");
    setSectionId(mappedSection ? String(mappedSection) : "");
    setSubjectId(mappedSubject ? String(mappedSubject) : "");
    setTeacherId(mappedTeacher ? String(mappedTeacher) : "");
    setIsOptional(!!row.is_optional);
    setMessage("");
    setError("");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this subject assignment?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/academics/class-subjects/${id}/`, { method: "DELETE" });
      await load();
    } catch {
      setError("Failed to delete subject assignment.");
    }
  };

  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Assign Subject</h1>
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)", padding: 12, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Select Criteria</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
            <select value={filterClassId} onChange={(e) => { setFilterClassId(e.target.value); setFilterSectionId(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
              <option value="">All classes</option>
              {data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section</label>
            <select value={filterSectionId} onChange={(e) => setFilterSectionId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
              <option value="">All sections</option>
              {filterSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => void load()} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Search</button>
          <button type="button" onClick={() => { setFilterClassId(""); setFilterSectionId(""); void load(); }} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto auto", gap: 8, marginBottom: 12, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Academic Year</label>
          <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select year</option>
            {data.years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select class</option>
            {data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">All sections</option>
            {availableSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select subject</option>
            {data.subjects.map((row) => <option key={row.id} value={row.id}>{row.name}{row.code ? ` (${row.code})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Teacher</label>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Unassigned</option>
            {data.teachers.map((row) => <option key={row.id} value={row.id}>{row.full_name || row.username}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 6, fontSize: 13 }}><input type="checkbox" checked={isOptional} onChange={(e) => setIsOptional(e.target.checked)} /> Optional</label>
        <button type="submit" disabled={saving} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>{saving ? "..." : editingId ? "Update" : "Assign"}</button>
        {editingId ? <button type="button" onClick={() => resetForm()} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Cancel</button> : null}
      </form>

      {(lookupError || error) && <p style={{ color: "var(--warning)", margin: "8px 0" }}>{lookupError || error}</p>}
      {message && <p style={{ color: "#16a34a", margin: "8px 0" }}>{message}</p>}

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Class</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Section</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Subject</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Teacher</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Optional</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 12 }}>Loading...</td></tr> : null}
            {!loading && items.length === 0 ? <tr><td colSpan={6} style={{ padding: 12, color: "var(--text-muted)" }}>No subject assignments found.</td></tr> : null}
            {!loading && items.map((row) => {
              const classValue = toId(row.class_id) ?? toId(row.school_class);
              const sectionValue = toId(row.section_id) ?? toId(row.section);
              const subjectValue = toId(row.subject_id) ?? toId(row.subject);
              const teacherValue = toId(row.teacher_id) ?? toId(row.teacher);
              return (
                <tr key={row.id}>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.classes, classValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.sections, sectionValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.subjects, subjectValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.teachers, teacherValue, (entry) => entry.full_name || entry.username)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{row.is_optional ? "Yes" : "No"}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => edit(row)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#0284c7", color: "#fff", cursor: "pointer", fontSize: 12 }}>Edit</button>
                    <button type="button" onClick={() => void remove(row.id)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ClassRoomPanel() {
  const [items, setItems] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [roomNo, setRoomNo] = useState("");
  const [capacity, setCapacity] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch<ApiList<ClassRoom>>("/api/v1/core/class-rooms/");
      setItems(asList(response));
    } catch {
      setError("Unable to load class rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = (clearNotice = true) => {
    setEditingId(null);
    setRoomNo("");
    setCapacity("");
    if (clearNotice) {
      setMessage("");
      setError("");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomNo.trim()) {
      setError("Room no is required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        room_no: roomNo.trim(),
        capacity: capacity ? Number(capacity) : null,
        active_status: true,
      };
      await apiFetch(editingId ? `/api/v1/core/class-rooms/${editingId}/` : "/api/v1/core/class-rooms/", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(editingId ? "Class room updated." : "Class room created.");
      resetForm(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save class room.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: ClassRoom) => {
    setEditingId(row.id);
    setRoomNo(row.room_no || "");
    setCapacity(row.capacity != null ? String(row.capacity) : "");
    setMessage("");
    setError("");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this class room?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/core/class-rooms/${id}/`, { method: "DELETE" });
      await load();
    } catch {
      setError("Failed to delete class room.");
    }
  };

  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Class Room</h1>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 160px auto auto", gap: 8, marginBottom: 12, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Room No</label>
          <input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="e.g. A-101" style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Capacity</label>
          <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
        </div>
        <button type="submit" disabled={saving} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>{saving ? "..." : editingId ? "Update" : "Add"}</button>
        {editingId ? <button type="button" onClick={() => resetForm()} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Cancel</button> : null}
      </form>

      {error && <p style={{ color: "var(--warning)", margin: "8px 0" }}>{error}</p>}
      {message && <p style={{ color: "#16a34a", margin: "8px 0" }}>{message}</p>}

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Room No</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Capacity</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={3} style={{ padding: 12 }}>Loading...</td></tr> : null}
            {!loading && items.length === 0 ? <tr><td colSpan={3} style={{ padding: 12, color: "var(--text-muted)" }}>No class room found.</td></tr> : null}
            {!loading && items.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{row.room_no}</td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{row.capacity ?? "-"}</td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => edit(row)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#0284c7", color: "#fff", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button type="button" onClick={() => void remove(row.id)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ClassRoutinePanel() {
  const { data, error: lookupError } = useLookupData();
  const [items, setItems] = useState<ClassRoutineSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [day, setDay] = useState("monday");
  const [periodId, setPeriodId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomText, setRoomText] = useState("");
  const [isBreak, setIsBreak] = useState(false);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [activeDayTab, setActiveDayTab] = useState("monday");

  useEffect(() => {
    if (!yearId && data.years.length) {
      setYearId(initialYearId(data.years));
    }
  }, [data.years, yearId]);

  useEffect(() => {
    if (!periodId) return;
    const selected = data.periods.find((period) => period.id === Number(periodId));
    if (!selected) return;
    setStartTime(selected.start_time?.slice(0, 5) || "");
    setEndTime(selected.end_time?.slice(0, 5) || "");
  }, [periodId, data.periods]);

  const load = async (overrides?: { classId?: string; sectionId?: string; day?: string }) => {
    try {
      setLoading(true);
      setError("");
      const classFilter = overrides?.classId ?? filterClassId;
      const sectionFilter = overrides?.sectionId ?? filterSectionId;
      const dayFilter = overrides?.day ?? activeDayTab;
      const params = new URLSearchParams();
      if (classFilter) params.set("class_id", classFilter);
      if (sectionFilter) params.set("section_id", sectionFilter);
      if (dayFilter) params.set("day", dayFilter);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await apiFetch<ApiList<ClassRoutineSlot>>(`/api/v1/academics/class-routines/${suffix}`);
      setItems(asList(response));
    } catch {
      setError("Unable to load class routine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void load();
  }, [activeDayTab]);

  const availableSections = useMemo(() => sectionOptionsForClass(data.sections, classId), [data.sections, classId]);
  const filterSections = useMemo(() => sectionOptionsForClass(data.sections, filterClassId), [data.sections, filterClassId]);

  const resetForm = (clearNotice = true) => {
    setEditingId(null);
    setClassId("");
    setSectionId("");
    setSubjectId("");
    setTeacherId("");
    setDay("monday");
    setPeriodId("");
    setStartTime("");
    setEndTime("");
    setRoomId("");
    setRoomText("");
    setIsBreak(false);
    if (clearNotice) {
      setMessage("");
      setError("");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId || !subjectId || !startTime || !endTime) {
      setError("Class, subject, start time and end time are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const roomName = roomText.trim() || nameById(data.rooms, roomId ? Number(roomId) : null, (entry) => entry.room_no);
      const payload = {
        academic_year_id: yearId ? Number(yearId) : null,
        class_id: Number(classId),
        section_id: sectionId ? Number(sectionId) : null,
        subject_id: Number(subjectId),
        teacher_id: teacherId ? Number(teacherId) : null,
        day,
        class_period_id: periodId ? Number(periodId) : null,
        start_time: startTime,
        end_time: endTime,
        room_id: roomId ? Number(roomId) : null,
        room: roomName || "",
        is_break: isBreak,
        active_status: true,
      };
      await apiFetch(editingId ? `/api/v1/academics/class-routines/${editingId}/` : "/api/v1/academics/class-routines/", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(editingId ? "Class routine updated." : "Class routine saved.");
      resetForm(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save class routine.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: ClassRoutineSlot) => {
    setEditingId(row.id);
    setYearId(row.academic_year_id ? String(row.academic_year_id) : "");
    const mappedClass = toId(row.class_id) ?? toId(row.school_class);
    const mappedSection = toId(row.section_id) ?? toId(row.section);
    const mappedSubject = toId(row.subject_id) ?? toId(row.subject);
    const mappedTeacher = toId(row.teacher_id) ?? toId(row.teacher);
    setClassId(mappedClass ? String(mappedClass) : "");
    setSectionId(mappedSection ? String(mappedSection) : "");
    setSubjectId(mappedSubject ? String(mappedSubject) : "");
    setTeacherId(mappedTeacher ? String(mappedTeacher) : "");
    setDay(row.day || "monday");
    setPeriodId(row.class_period_id ? String(row.class_period_id) : "");
    setStartTime(row.start_time?.slice(0, 5) || "");
    setEndTime(row.end_time?.slice(0, 5) || "");
    setRoomId(row.room_id ? String(row.room_id) : "");
    setRoomText(row.room || "");
    setIsBreak(!!row.is_break);
    setActiveDayTab(row.day || "monday");
    setMessage("");
    setError("");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this class routine slot?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/academics/class-routines/${id}/`, { method: "DELETE" });
      await load();
    } catch {
      setError("Failed to delete class routine slot.");
    }
  };

  const dayOptions = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Class Routine</h1>
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)", padding: 12, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Select Criteria</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
            <select value={filterClassId} onChange={(e) => { setFilterClassId(e.target.value); setFilterSectionId(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
              <option value="">All classes</option>
              {data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section</label>
            <select value={filterSectionId} onChange={(e) => setFilterSectionId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
              <option value="">All sections</option>
              {filterSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => void load()} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Search</button>
          <button type="button" onClick={() => { setFilterClassId(""); setFilterSectionId(""); setActiveDayTab("monday"); void load({ classId: "", sectionId: "", day: "monday" }); }} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Academic Year</label>
          <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select year</option>
            {data.years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select class</option>
            {data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">All sections</option>
            {availableSections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select subject</option>
            {data.subjects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Teacher</label>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Unassigned</option>
            {data.teachers.map((row) => <option key={row.id} value={row.id}>{row.full_name || row.username}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            {dayOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class Period</label>
          <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Custom time</option>
            {data.periods.map((row) => <option key={row.id} value={row.id}>{row.period}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Start Time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>End Time</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Room</label>
          <select value={roomId} onChange={(e) => { setRoomId(e.target.value); setRoomText(""); }} style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }}>
            <option value="">Select room</option>
            {data.rooms.filter((room) => room.active_status).map((row) => <option key={row.id} value={row.id}>{row.room_no}</option>)}
          </select>
        </div>

        <div style={{ gridColumn: "1 / span 2" }}>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Room Text (optional)</label>
          <input value={roomText} onChange={(e) => setRoomText(e.target.value)} placeholder="Override room label" style={{ marginTop: 4, width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 24, fontSize: 13 }}><input type="checkbox" checked={isBreak} onChange={(e) => setIsBreak(e.target.checked)} /> Break</label>
        <button type="submit" disabled={saving} style={{ height: 36, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", marginTop: 24 }}>{saving ? "..." : editingId ? "Update" : "Save"}</button>
        {editingId ? <button type="button" onClick={() => resetForm()} style={{ height: 36, background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", marginTop: 24 }}>Cancel</button> : null}
      </form>

      {(lookupError || error) && <p style={{ color: "var(--warning)", margin: "8px 0" }}>{lookupError || error}</p>}
      {message && <p style={{ color: "#16a34a", margin: "8px 0" }}>{message}</p>}

      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--line)", marginBottom: 10, overflowX: "auto" }}>
        {dayOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveDayTab(option.value)}
            style={{
              height: 34,
              padding: "0 12px",
              border: "none",
              borderBottom: activeDayTab === option.value ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: activeDayTab === option.value ? "var(--primary)" : "var(--text-muted)",
              fontWeight: activeDayTab === option.value ? 600 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Class</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Section</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Time</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Subject</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Teacher</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Room</th>
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 12 }}>Loading...</td></tr> : null}
            {!loading && items.length === 0 ? <tr><td colSpan={7} style={{ padding: 12, color: "var(--text-muted)" }}>No class routine slots found for {dayOptions.find((d) => d.value === activeDayTab)?.label}.</td></tr> : null}
            {!loading && items.map((row) => {
              const classValue = toId(row.class_id) ?? toId(row.school_class);
              const sectionValue = toId(row.section_id) ?? toId(row.section);
              const subjectValue = toId(row.subject_id) ?? toId(row.subject);
              const teacherValue = toId(row.teacher_id) ?? toId(row.teacher);
              const roomLabel = row.room || nameById(data.rooms, row.room_id, (entry) => entry.room_no);
              return (
                <tr key={row.id}>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.classes, classValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.sections, sectionValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{row.start_time?.slice(0, 5)} - {row.end_time?.slice(0, 5)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.subjects, subjectValue, (entry) => entry.name)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{nameById(data.teachers, teacherValue, (entry) => entry.full_name || entry.username)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{roomLabel || "-"}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => edit(row)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#0284c7", color: "#fff", cursor: "pointer", fontSize: 12 }}>Edit</button>
                    <button type="button" onClick={() => void remove(row.id)} style={{ height: 28, padding: "0 10px", border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
