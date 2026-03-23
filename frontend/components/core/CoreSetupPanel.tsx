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
      await apiFetch("/api/v1/core/academic-years/", { method: "POST", body: JSON.stringify({ name: name.trim(), start_date: startDate, end_date: endDate, is_current: isCurrent }) });
      setName(""); setStartDate(""); setEndDate(""); setIsCurrent(false);
      await load();
    } catch { setError("Failed to create academic year."); } finally { setSaving(false); }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Year Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2025-2026" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", paddingBottom: 4 }}><input type="checkbox" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} style={{ accentColor: "var(--primary)" }} /> Current</label>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>{saving ? "…" : "Add"}</button>
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {["Name", "Start", "End", "Current"].map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(y => (
          <tr key={y.id}>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{y.name}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{y.start_date}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{y.end_date}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{y.is_current ? <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>✓ Active</span> : null}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Classes ─────────────────────────────────────────────────────────────────
function ClassesSection() {
  const [items, setItems] = useState<SchoolClass[]>([]);
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
      await apiFetch("/api/v1/core/classes/", { method: "POST", body: JSON.stringify({ name: name.trim(), numeric_order: parseInt(order, 10) || 0 }) });
      setName(""); setOrder("0"); await load();
    } catch { setError("Failed to create class."); } finally { setSaving(false); }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div style={{ flex: 1 }}><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Class Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 1" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div style={{ width: 80 }}><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Order</label><input type="number" value={order} onChange={e => setOrder(e.target.value)} style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>{saving ? "…" : "Add"}</button>
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {["Class", "Sections", "Order"].map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(c => (
          <tr key={c.id}>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{c.name}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{(c.sections || []).map(s => s.name).join(", ") || "—"}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{c.numeric_order}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
function SubjectsSection() {
  const [items, setItems] = useState<Subject[]>([]);
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
      await apiFetch("/api/v1/core/subjects/", { method: "POST", body: JSON.stringify({ name: name.trim(), code: code.trim(), subject_type: subjectType }) });
      setName(""); setCode(""); setSubjectType("compulsory"); await load();
    } catch { setError("Failed to create subject."); } finally { setSaving(false); }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Subject Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" style={{ display: "block", width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Code</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="MATH" style={{ display: "block", width: 80, height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", marginTop: 4 }} /></div>
        <div><label style={{ fontSize: 12, color: "var(--text-muted)" }}>Type</label><select value={subjectType} onChange={e => setSubjectType(e.target.value)} style={{ display: "block", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 8px", marginTop: 4 }}><option value="compulsory">Compulsory</option><option value="elective">Elective</option><option value="optional">Optional</option></select></div>
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>{saving ? "…" : "Add"}</button>
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {["Name", "Code", "Type"].map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(s => (
          <tr key={s.id}>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{s.name}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{s.code || "—"}</td>
            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, textTransform: "capitalize" }}>{s.subject_type}</td>
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
      await apiFetch("/api/v1/core/sections/", {
        method: "POST",
        body: JSON.stringify({
          school_class: Number(schoolClassId),
          name: name.trim(),
          capacity: parseInt(capacity, 10) || 0,
        }),
      });
      setName("");
      setCapacity("0");
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create section.";
      setError(message === "401" ? "Session expired. Please log in again." : "Failed to create section.");
    } finally {
      setSaving(false);
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
        <button type="submit" disabled={saving} style={{ height: 36, padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", alignSelf: "flex-end" }}>{saving ? "…" : "Add"}</button>
      </form>
      {error && <p style={{ color: "var(--warning)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
          {"Class,Section,Capacity".split(",").map(h => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(s => {
          const schoolClass = classes.find((c) => c.id === s.school_class);
          return (
            <tr key={s.id}>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{schoolClass?.name || `Class ${s.school_class}`}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{s.name}</td>
              <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>{s.capacity ?? 0}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function CoreSetupPanel() {
  const [tab, setTab] = useState<Tab>("years");
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
