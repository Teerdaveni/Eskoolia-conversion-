"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { TimeSpinnerPicker } from "@/components/common/TimeSpinnerPicker";

type ClassPeriod = {
  id: number;
  period: string;
  start_time: string;
  end_time: string;
  period_type: "class" | "exam";
  is_break: boolean;
};

type ApiList<T> = T[] | { results?: T[] };

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { cache: "no-store", headers: { "Content-Type": "application/json" } });
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<unknown>(path, { method: "DELETE", headers: { "Content-Type": "application/json" } });
}

function listData<T>(v: ApiList<T>): T[] {
  return Array.isArray(v) ? v : v.results ?? [];
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
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

function LegacyBreadcrumb({ title, sub }: { title: string; sub: string }) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span><span>/</span><span>Core Setup</span><span>/</span><span>{sub}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ClassPeriodsPanel() {
  const [items, setItems] = useState<ClassPeriod[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [period, setPeriod] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [periodType, setPeriodType] = useState<"class" | "exam">("class");
  const [isBreak, setIsBreak] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<"" | "class" | "exam">("");

  const load = async () => {
    const query = filterType ? `?period_type=${filterType}` : "";
    const data = await apiGet<ApiList<ClassPeriod>>(`/api/v1/core/class-periods/${query}`);
    setItems(listData(data));
  };

  useEffect(() => { void load(); }, [filterType]);

  const resetForm = () => {
    setEditingId(null);
    setPeriod("");
    setStartTime("");
    setEndTime("");
    setPeriodType("class");
    setIsBreak(false);
  };

  const startEdit = (row: ClassPeriod) => {
    setEditingId(row.id);
    setPeriod(row.period);
    setStartTime(row.start_time);
    setEndTime(row.end_time);
    setPeriodType(row.period_type as "class" | "exam");
    setIsBreak(row.is_break);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!period.trim() || !startTime || !endTime) {
      setError("Period name, start time and end time are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = { period: period.trim(), start_time: startTime, end_time: endTime, period_type: periodType, is_break: isBreak };
      if (editingId) {
        await apiPut(`/api/v1/core/class-periods/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/core/class-periods/", payload);
      }
      resetForm();
      await load();
    } catch {
      setError("Unable to save class period.");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    try {
      await apiDelete(`/api/v1/core/class-periods/${id}/`);
      await load();
    } catch {
      setError("Unable to delete class period.");
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Class Periods" sub="Class Periods" />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>{editingId ? "Edit Class Period" : "Add Class Period"}</div>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto auto", gap: 8, alignItems: "end" }}>
              <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Period name (e.g. Period 1)" style={fieldStyle()} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, gridColumn: 'span 2' }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Start</label>
                  <TimeSpinnerPicker value={startTime} onChange={setStartTime} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>End</label>
                  <TimeSpinnerPicker value={endTime} onChange={setEndTime} />
                </div>
              </div>
              <select value={periodType} onChange={(e) => setPeriodType(e.target.value as "class" | "exam")} style={fieldStyle()}>
                <option value="class">Class</option>
                <option value="exam">Exam</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={isBreak} onChange={(e) => setIsBreak(e.target.checked)} />
                Break
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {editingId && <button type="button" onClick={resetForm} style={btnStyle("#6b7280")}>Cancel</button>}
                <button type="submit" disabled={saving} style={btnStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Add"}</button>
              </div>
            </form>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Class Periods</div>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as "" | "class" | "exam")} style={{ ...fieldStyle(), width: 140 }}>
                  <option value="">All types</option>
                  <option value="class">Class</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Period</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Start Time</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>End Time</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Break</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.period}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.start_time}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.end_time}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.period_type}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_break ? "Yes" : "No"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => startEdit(row)} style={btnStyle()}>Edit</button>
                        <button type="button" onClick={() => void del(row.id)} style={btnStyle("#dc2626")}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 8, color: "var(--text-muted)" }}>No class periods configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
