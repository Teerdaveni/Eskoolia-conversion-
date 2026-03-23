"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type AdminSetupRow = {
  id: number;
  type: "1" | "2" | "3" | "4";
  name: string;
  description?: string;
};

const TYPE_OPTIONS: Array<{ value: AdminSetupRow["type"]; label: string }> = [
  { value: "1", label: "Purpose" },
  { value: "2", label: "Complaint Type" },
  { value: "3", label: "Source" },
  { value: "4", label: "Reference" },
];

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<void>(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
}

async function apiMutate<T>(path: string, method: "POST" | "PATCH", payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function boxStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 16,
  } as const;
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

function buttonStyle(color = "var(--primary)") {
  return {
    height: 36,
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    borderRadius: 8,
    padding: "0 12px",
    cursor: "pointer",
    fontSize: 13,
  } as const;
}

export function AdminSetupPanel() {
  const [items, setItems] = useState<AdminSetupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<AdminSetupRow["type"] | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<ApiList<AdminSetupRow>>("/api/v1/admissions/admin-setups/");
      setItems(listData(data));
    } catch {
      setError("Unable to load admin setups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setType("");
    setName("");
    setDescription("");
  };

  const edit = (row: AdminSetupRow) => {
    setEditingId(row.id);
    setType(row.type);
    setName(row.name || "");
    setDescription(row.description || "");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!type || !name.trim()) {
      setError("Type and name are required.");
      return;
    }

    const payload = {
      type,
      name: name.trim(),
      description: description.trim(),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (editingId) {
        await apiMutate(`/api/v1/admissions/admin-setups/${editingId}/`, "PATCH", payload);
        setSuccess("Admin setup updated successfully.");
      } else {
        await apiMutate("/api/v1/admissions/admin-setups/", "POST", payload);
        setSuccess("Admin setup saved successfully.");
      }
      reset();
      await load();
    } catch {
      setError(editingId ? "Unable to update admin setup." : "Unable to save admin setup.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this admin setup entry?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/admin-setups/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Admin setup deleted.");
    } catch {
      setError("Unable to delete admin setup.");
    } finally {
      setBusyId(null);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<AdminSetupRow["type"], AdminSetupRow[]>();
    TYPE_OPTIONS.forEach((opt) => map.set(opt.value, []));
    items.forEach((row) => {
      const current = map.get(row.type) || [];
      current.push(row);
      map.set(row.type, current);
    });
    return map;
  }, [items]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Admin Setup</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Admin Setup</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Admin Setup" : "Add Admin Setup"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <select value={type} onChange={(e) => setType(e.target.value as AdminSetupRow["type"])} style={fieldStyle()}>
                  <option value="">Type *</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" style={fieldStyle()} />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={reset} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Admin Setup List</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {TYPE_OPTIONS.map((group) => {
                  const rows = grouped.get(group.value) || [];
                  return (
                    <details key={group.value} open style={{ border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }}>
                      <summary style={{ listStyle: "none", cursor: "pointer", padding: "10px 12px", fontWeight: 600 }}>
                        {group.label}
                      </summary>
                      <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
                        {rows.length === 0 ? (
                          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No entries yet.</div>
                        ) : (
                          rows.map((row) => (
                            <div key={row.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>{row.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.description || "-"}</div>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button type="button" onClick={() => edit(row)} style={buttonStyle("#0ea5e9")}>Edit</button>
                                <button type="button" disabled={busyId === row.id} onClick={() => void remove(row.id)} style={buttonStyle("#dc2626")}>Delete</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading admin setups...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
