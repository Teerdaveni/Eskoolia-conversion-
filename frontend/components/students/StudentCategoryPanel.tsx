"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type StudentCategory = {
  id: number;
  name: string;
  description: string;
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
    minHeight: 96,
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

export function StudentCategoryPanel() {
  const [rows, setRows] = useState<StudentCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<ApiList<StudentCategory>>("/api/v1/students/categories/");
      setRows(listData(data));
    } catch {
      setError("Unable to load student categories.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Category is required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = { name: name.trim(), description: description.trim() };
      if (editingId) {
        await apiPatch(`/api/v1/students/categories/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/students/categories/", payload);
      }
      resetForm();
      await load();
    } catch {
      setError("Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: StudentCategory) => {
    setEditingId(row.id);
    setName(row.name);
    setDescription(row.description || "");
  };

  const onDelete = async (row: StudentCategory) => {
    const yes = window.confirm(`Delete category \"${row.name}\"?`);
    if (!yes) {
      return;
    }
    try {
      setError("");
      await apiDelete(`/api/v1/students/categories/${row.id}/`);
      if (editingId === row.id) {
        resetForm();
      }
      await load();
    } catch {
      setError("Unable to delete category.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Student Category</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Student Information</span>
              <span>/</span>
              <span>Student Category</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          {editingId && (
            <div className="row" style={{ marginBottom: 12 }}>
              <div style={{ marginLeft: "auto" }}>
                <button type="button" style={buttonStyle()} onClick={resetForm}>
                  + Add
                </button>
              </div>
            </div>
          )}

          <div className="row" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="col-lg-3">
              <div className="white-box" style={boxStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Student Category" : "Add Student Category"}</h3>
                <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Type *</label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Category"
                      style={fieldStyle()}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Description</label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Optional description"
                      style={textareaStyle()}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                    <button type="submit" disabled={saving} style={buttonStyle()}>
                      {saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="white-box" style={boxStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>Student Category List</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>SL</th>
                        <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Category</th>
                        <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: 12, color: "var(--text-muted)" }}>
                            No categories found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => (
                          <tr key={row.id}>
                            <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{index + 1}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
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
