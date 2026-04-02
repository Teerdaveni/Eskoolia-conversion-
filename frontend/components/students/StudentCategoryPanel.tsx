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
          <div className="student-maint-header">
            <h1 className="student-maint-title">Student Category</h1>
            <div className="student-maint-crumbs">
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
            <div className="row student-maint-add-row">
              <div className="student-maint-add-wrap">
                <button type="button" className="student-btn student-btn-primary" onClick={resetForm}>
                  + Add
                </button>
              </div>
            </div>
          )}

          <div className="student-maint-layout">
            <div className="col-lg-3">
              <div className="white-box student-maint-form">
                <h3>{editingId ? "Edit Student Category" : "Add Student Category"}</h3>
                <form onSubmit={submit} className="student-maint-grid">
                  <div>
                    <label className="student-maint-label" htmlFor="student-category-name">Type *</label>
                    <input
                      id="student-category-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Category"
                      className="student-maint-input"
                    />
                  </div>

                  <div>
                    <label className="student-maint-label" htmlFor="student-category-description">Description</label>
                    <textarea
                      id="student-category-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Optional description"
                      className="student-maint-textarea"
                    />
                  </div>

                  <div className="student-maint-actions">
                    <button type="submit" disabled={saving} className="student-btn student-btn-primary">
                      {saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="white-box student-maint-list">
                <h3>Student Category List</h3>
                <div className="student-maint-table-wrap">
                  <table className="student-maint-table">
                    <thead>
                      <tr>
                        <th>SL</th>
                        <th>Category</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="student-maint-empty">
                            No categories found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => (
                          <tr key={row.id}>
                            <td>{index + 1}</td>
                            <td>{row.name}</td>
                            <td>
                              <div className="student-maint-row-actions">
                                <button type="button" className="student-btn student-btn-info" onClick={() => onEdit(row)}>
                                  Edit
                                </button>
                                <button type="button" className="student-btn student-btn-danger" onClick={() => void onDelete(row)}>
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

                {error && <p className="student-maint-error">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
