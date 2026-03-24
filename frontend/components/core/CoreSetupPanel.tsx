"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type AcademicYear = { id: number; name: string; start_date: string; end_date: string; is_current: boolean };
type SchoolClass = { id: number; name: string; numeric_order: number; sections: Section[] };
type Section = { id: number; school_class: number; name: string; capacity: number };
type Subject = { id: number; name: string; code: string; subject_type: string };

type Tab = "years" | "classes" | "sections" | "subjects";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
}

// ─── Academic Years ──────────────────────────────────────────────────────────
function AcademicYearsSection() {
  const [items, setItems] = useState<AcademicYear[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      type R = { results?: AcademicYear[] };
      const data = await apiFetch<R | AcademicYear[]>("/api/v1/core/academic-years/");
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch { setError("Unable to load academic years."); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) { setError("Name, start and end date are required."); return; }
    try {
      setSaving(true); setError("");
      const payload = { name: name.trim(), start_date: startDate, end_date: endDate, is_current: isCurrent };
      await apiFetch(
        editingId ? `/api/v1/core/academic-years/${editingId}/` : "/api/v1/core/academic-years/",
        { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) }
      );
      setName(""); setStartDate(""); setEndDate(""); setIsCurrent(false);
      setEditingId(null);
      await load();
    } catch { setError(editingId ? "Failed to update academic year." : "Failed to create academic year."); } finally { setSaving(false); }
  };

  const edit = (row: AcademicYear) => {
    setEditingId(row.id);
    setName(row.name || "");
    setStartDate(row.start_date || "");
    setEndDate(row.end_date || "");
    setIsCurrent(!!row.is_current);
  };

  const reset = () => {
    setEditingId(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(false);
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this academic year?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/core/academic-years/${id}/`, { method: "DELETE" });
      if (editingId === id) reset();
      await load();
    } catch {
      setError("Failed to delete academic year.");
    }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Year Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2025-2026" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", paddingBottom: 4 }}><input type="checkbox" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} style={{ accentColor: "var(--primary)" }} /> Current</label>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>{saving ? "…" : editingId ? "Update" : "Add"}</button>
        {editingId ? <button type="button" onClick={reset} style={{ height: 36, padding: "0 14px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button> : null}
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {["Name", "Start", "End", "Current", "Actions"].map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(y => (
          <tr key={y.id}>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{y.name}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{y.start_date}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{y.end_date}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{y.is_current ? <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>✓ Active</span> : null}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
              <button type="button" onClick={() => edit(y)} style={{ height: 28, padding: "0 10px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
              <button type="button" onClick={() => void remove(y.id)} style={{ height: 28, padding: "0 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Classes ─────────────────────────────────────────────────────────────────
function ClassesSection() {
  const [items, setItems] = useState<SchoolClass[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [order, setOrder] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      type R = { results?: SchoolClass[] };
      const data = await apiFetch<R | SchoolClass[]>("/api/v1/core/classes/");
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch { setError("Unable to load classes."); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Class name is required."); return; }
    try {
      setSaving(true); setError("");
      const payload = { name: name.trim(), numeric_order: parseInt(order, 10) || 0 };
      await apiFetch(
        editingId ? `/api/v1/core/classes/${editingId}/` : "/api/v1/core/classes/",
        { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) }
      );
      setName(""); setOrder("0"); setEditingId(null); await load();
    } catch { setError(editingId ? "Failed to update class." : "Failed to create class."); } finally { setSaving(false); }
  };

  const edit = (row: SchoolClass) => {
    setEditingId(row.id);
    setName(row.name || "");
    setOrder(String(row.numeric_order || 0));
  };

  const reset = () => {
    setEditingId(null);
    setName("");
    setOrder("0");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/core/classes/${id}/`, { method: "DELETE" });
      if (editingId === id) reset();
      await load();
    } catch {
      setError("Failed to delete class.");
    }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div style={{ flex: 1 }}><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 1" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div style={{ width: 80 }}><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Order</label><input type="number" value={order} onChange={e => setOrder(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>{saving ? "…" : editingId ? "Update" : "Add"}</button>
        {editingId ? <button type="button" onClick={reset} style={{ height: 36, padding: "0 14px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>Cancel</button> : null}
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {["Class", "Sections", "Order", "Actions"].map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(c => (
          <tr key={c.id}>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{c.name}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{(c.sections || []).map(s => s.name).join(", ") || "—"}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{c.numeric_order}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
              <button type="button" onClick={() => edit(c)} style={{ height: 28, padding: "0 10px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
              <button type="button" onClick={() => void remove(c.id)} style={{ height: 28, padding: "0 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
function SubjectsSection() {
  const [items, setItems] = useState<Subject[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subjectType, setSubjectType] = useState("compulsory");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      type R = { results?: Subject[] };
      const data = await apiFetch<R | Subject[]>("/api/v1/core/subjects/");
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch { setError("Unable to load subjects."); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Subject name is required."); return; }
    try {
      setSaving(true); setError("");
      const payload = { name: name.trim(), code: code.trim(), subject_type: subjectType };
      await apiFetch(
        editingId ? `/api/v1/core/subjects/${editingId}/` : "/api/v1/core/subjects/",
        { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) }
      );
      setName(""); setCode(""); setSubjectType("compulsory"); setEditingId(null); await load();
    } catch { setError(editingId ? "Failed to update subject." : "Failed to create subject."); } finally { setSaving(false); }
  };

  const edit = (row: Subject) => {
    setEditingId(row.id);
    setName(row.name || "");
    setCode(row.code || "");
    setSubjectType(row.subject_type || "compulsory");
  };

  const reset = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setSubjectType("compulsory");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/core/subjects/${id}/`, { method: "DELETE" });
      if (editingId === id) reset();
      await load();
    } catch {
      setError("Failed to delete subject.");
    }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Subject Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Code</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="MATH" style={{ display: "block", width: 80, height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Type</label><select value={subjectType} onChange={e => setSubjectType(e.target.value)} style={{ display: "block", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 8px", marginTop: 4 }}><option value="compulsory">Compulsory</option><option value="elective">Elective</option><option value="optional">Optional</option></select></div>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>{saving ? "…" : editingId ? "Update" : "Add"}</button>
        {editingId ? <button type="button" onClick={reset} style={{ height: 36, padding: "0 14px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>Cancel</button> : null}
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {["Name", "Code", "Type", "Actions"].map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(s => (
          <tr key={s.id}>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{s.name}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{s.code || "—"}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, textTransform: "capitalize" }}>{s.subject_type}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
              <button type="button" onClick={() => edit(s)} style={{ height: 28, padding: "0 10px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
              <button type="button" onClick={() => void remove(s.id)} style={{ height: 28, padding: "0 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────
function SectionsSection() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [items, setItems] = useState<Section[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [schoolClassId, setSchoolClassId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      type CR = { results?: SchoolClass[] };
      type SR = { results?: Section[] };
      const [classData, sectionData] = await Promise.all([
        apiFetch<CR | SchoolClass[]>("/api/v1/core/classes/"),
        apiFetch<SR | Section[]>("/api/v1/core/sections/"),
      ]);
      setClasses(Array.isArray(classData) ? classData : classData.results || []);
      setItems(Array.isArray(sectionData) ? sectionData : sectionData.results || []);
    } catch {
      setError("Unable to load sections.");
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolClassId || !name.trim()) {
      setError("Class and section name are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {
        school_class: Number(schoolClassId),
        name: name.trim(),
        capacity: parseInt(capacity, 10) || 0,
      };
      await apiFetch(editingId ? `/api/v1/core/sections/${editingId}/` : "/api/v1/core/sections/", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({
          ...payload,
        }),
      });
      setName("");
      setCapacity("0");
      setSchoolClassId("");
      setEditingId(null);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create section.";
      setError(message === "401" ? "Session expired. Please log in again." : editingId ? "Failed to update section." : "Failed to create section.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: Section) => {
    setEditingId(row.id);
    setSchoolClassId(String(row.school_class));
    setName(row.name || "");
    setCapacity(String(row.capacity ?? 0));
  };

  const reset = () => {
    setEditingId(null);
    setSchoolClassId("");
    setName("");
    setCapacity("0");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      setError("");
      await apiFetch(`/api/v1/core/sections/${id}/`, { method: "DELETE" });
      if (editingId === id) reset();
      await load();
    } catch {
      setError("Failed to delete section.");
    }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class</label>
          <select value={schoolClassId} onChange={(e) => setSchoolClassId(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }}>
            <option value="">Select class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Section Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. A" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Capacity</label><input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>{saving ? "…" : editingId ? "Update" : "Add"}</button>
        {editingId ? <button type="button" onClick={reset} style={{ height: 36, padding: "0 14px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>Cancel</button> : null}
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {"Class,Section,Capacity,Actions".split(",").map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(s => {
          const schoolClass = classes.find((c) => c.id === s.school_class);
          return (
            <tr key={s.id}>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{schoolClass?.name || `Class ${s.school_class}`}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{s.name}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{s.capacity ?? 0}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", display: "flex", gap: 6 }}>
                <button type="button" onClick={() => edit(s)} style={{ height: 28, padding: "0 10px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
                <button type="button" onClick={() => void remove(s.id)} style={{ height: 28, padding: "0 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Delete</button>
              </td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
type CoreSetupPanelProps = {
  initialTab?: Tab;
};

export function CoreSetupPanel({ initialTab = "years" }: CoreSetupPanelProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const tabs: { key: Tab; label: string }[] = [
    { key: "years", label: "Academic Years" },
    { key: "classes", label: "Classes" },
    { key: "sections", label: "Sections" },
    { key: "subjects", label: "Subjects" },
  ];

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Core Setup</h1>
        <p style={{ marginTop: 8, color: "var(--text-muted)" }}>Configure academic years, classes, sections, and subjects.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "transparent",
              borderBottom: tab === t.key ? "2px solid var(--primary)" : "2px solid transparent",
              color: tab === t.key ? "var(--primary)" : "var(--text-muted)",
              fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer",
              fontSize: 14,
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
        {tab === "years" && <AcademicYearsSection />}
        {tab === "classes" && <ClassesSection />}
        {tab === "sections" && <SectionsSection />}
        {tab === "subjects" && <SubjectsSection />}
      </div>
    </section>
  );
}
