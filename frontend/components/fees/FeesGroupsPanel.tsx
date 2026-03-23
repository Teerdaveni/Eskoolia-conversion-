"use client";

import { FormEvent, useEffect, useState } from "react";
import { feesApi, FeesGroup, listData, AcademicYear } from "@/lib/fees-api";

function field() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function btn(color = "var(--primary)") {
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

export default function FeesGroupsPanel() {
  const [rows, setRows] = useState<FeesGroup[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const [groupsData, yearsData] = await Promise.all([feesApi.listGroups(), feesApi.listAcademicYears()]);
    const y = listData(yearsData);
    setRows(listData(groupsData));
    setYears(y);
    if (!yearId) {
      const current = y.find((it) => it.is_current) || y[0];
      if (current) setYearId(String(current.id));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!yearId || !name.trim()) {
      setError("Academic year and group name are required.");
      return;
    }
    try {
      setError("");
      const payload = { academic_year: Number(yearId), name: name.trim(), description };
      if (editingId) {
        await feesApi.updateGroup(editingId, payload);
      } else {
        await feesApi.createGroup(payload);
      }
      setEditingId(null);
      setName("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20"><div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Fees Group</h1></div></section>
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Fees Group" : "Add Fees Group"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr auto", gap: 8 }}>
            <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={field()}>
              <option value="">Academic year</option>
              {years.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" style={field()} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={field()} />
            <button type="submit" style={btn()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Description</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.description || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={btn("#0ea5e9")} onClick={() => { setEditingId(row.id); setYearId(String(row.academic_year)); setName(row.name); setDescription(row.description || ""); }}>Edit</button>
                      <button type="button" style={btn("#dc2626")} onClick={() => void feesApi.deleteGroup(row.id).then(load).catch((e) => setError(e instanceof Error ? e.message : "Delete failed."))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}
