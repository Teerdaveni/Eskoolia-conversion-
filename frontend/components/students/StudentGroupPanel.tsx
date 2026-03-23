"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type StudentGroup = {
  id: number;
  name: string;
  description: string;
  students_count?: number;
};

type ApiList<T> = T[] | { results?: T[] };

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

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<void>(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
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

function textareaStyle() {
  return {
    width: "100%",
    minHeight: 84,
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px",
    resize: "vertical" as const,
  };
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

function boxStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 16,
  } as const;
}

export function StudentGroupPanel() {
  const [rows, setRows] = useState<StudentGroup[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<ApiList<StudentGroup>>("/api/v1/students/groups/");
      setRows(listData(data));
    } catch {
      setError("Unable to load student groups.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = { name: name.trim(), description: description.trim() };
      if (editingId) {
        await apiPatch(`/api/v1/students/groups/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/students/groups/", payload);
      }
      reset();
      await load();
    } catch {
      setError("Unable to save student group.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: StudentGroup) => {
    setEditingId(row.id);
    setName(row.name);
    setDescription(row.description || "");
  };

  const onDelete = async (row: StudentGroup) => {
    const yes = window.confirm(`Delete group \"${row.name}\"?`);
    if (!yes) {
      return;
    }

    try {
      setError("");
      await apiDelete(`/api/v1/students/groups/${row.id}/`);
      if (editingId === row.id) {
        reset();
      }
      await load();
    } catch {
      setError("Unable to delete student group.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Student Group</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Student Information</span>
              <span>/</span>
              <span>Student Group</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          {editingId && (
            <div className="row" style={{ marginBottom: 12 }}>
              <div style={{ marginLeft: "auto" }}>
                <button type="button" style={buttonStyle()} onClick={reset}>
                  + Add
                </button>
              </div>
            </div>
          )}

          <div className="row" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="col-lg-3">
              <div className="white-box" style={boxStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Student Group" : "Add Student Group"}</h3>
                <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Group *</label>
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group" style={fieldStyle()} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Description</label>
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} style={textareaStyle()} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                    <button type="submit" disabled={saving} style={buttonStyle()}>
                      {saving ? "Saving..." : editingId ? "Update Group" : "Save Group"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="white-box" style={boxStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>Student Group List</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Group</th>
                        <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Students</th>
                        <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: 12, color: "var(--text-muted)" }}>
                            No groups found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={row.id}>
                            <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.students_count ?? 0}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => onEdit(row)}>
                                  Edit
                                </button>
                                <button type="button" style={buttonStyle("#dc2626")} onClick={() => void onDelete(row)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {error && <p style={{ color: "var(--warning)", marginTop: 10 }}>{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
