"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type IdCardRow = {
  id: number;
  title: string;
  page_layout_style: "horizontal" | "vertical";
  applicable_role_ids: number[];
  background_url?: string;
  profile_url?: string;
  logo_url?: string;
  signature_url?: string;
};

type RoleOption = {
  id: number;
  name: string;
};

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

async function apiForm<T>(path: string, method: "POST" | "PATCH", formData: FormData): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method,
    body: formData,
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

export function IdCardPanel() {
  const [items, setItems] = useState<IdCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [backgroundUpload, setBackgroundUpload] = useState<File | null>(null);
  const [profileUpload, setProfileUpload] = useState<File | null>(null);
  const [logoUpload, setLogoUpload] = useState<File | null>(null);
  const [signatureUpload, setSignatureUpload] = useState<File | null>(null);

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [templateData, roleData] = await Promise.all([
        apiGet<ApiList<IdCardRow>>("/api/v1/admissions/id-card-templates/"),
        apiGet<ApiList<RoleOption>>("/api/v1/access-control/roles/"),
      ]);
      setItems(listData(templateData));
      setRoles(listData(roleData));
    } catch {
      setError("Unable to load ID cards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setLayout("horizontal");
    setSelectedRoleIds([]);
    setBackgroundUpload(null);
    setProfileUpload(null);
    setLogoUpload(null);
    setSignatureUpload(null);
    setBackgroundUrl("");
    setProfileUrl("");
    setLogoUrl("");
    setSignatureUrl("");
    setFieldErrors({});
  };

  const edit = (row: IdCardRow) => {
    setEditingId(row.id);
    setTitle(row.title || "");
    setLayout((row.page_layout_style || "horizontal") as "horizontal" | "vertical");
    setSelectedRoleIds((row.applicable_role_ids || []).map((value) => String(value)));
    setBackgroundUpload(null);
    setProfileUpload(null);
    setLogoUpload(null);
    setSignatureUpload(null);
    setBackgroundUrl(row.background_url || "");
    setProfileUrl(row.profile_url || "");
    setLogoUrl(row.logo_url || "");
    setSignatureUrl(row.signature_url || "");
    setFieldErrors({});
  };

  const parseRoleIds = () => selectedRoleIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);

  const roleNameById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setFieldErrors({ title: "ID card title is required." });
      setError("ID card title is required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("page_layout_style", layout);
    formData.append("applicable_role_ids", JSON.stringify(parseRoleIds()));

    if (backgroundUpload) formData.append("background_upload", backgroundUpload);
    if (profileUpload) formData.append("profile_upload", profileUpload);
    if (logoUpload) formData.append("logo_upload", logoUpload);
    if (signatureUpload) formData.append("signature_upload", signatureUpload);

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setFieldErrors({});
      if (editingId) {
        await apiForm(`/api/v1/admissions/id-card-templates/${editingId}/`, "PATCH", formData);
        setSuccess("ID card updated successfully.");
      } else {
        await apiForm("/api/v1/admissions/id-card-templates/", "POST", formData);
        setSuccess("ID card saved successfully.");
      }
      reset();
      await load();
    } catch {
      setError(editingId ? "Unable to update ID card." : "Unable to save ID card.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this ID card template?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/id-card-templates/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("ID card deleted.");
    } catch {
      setError("Unable to delete ID card.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => [row.title, row.page_layout_style, (row.applicable_role_ids || []).join(",")].join(" ").toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>ID Card</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>ID Card</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit ID Card" : "Create ID Card"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) setFieldErrors({});
                  }}
                  placeholder="ID Card Title *"
                  style={{ ...fieldStyle(), borderColor: fieldErrors.title ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.title ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.title}</span> : null}
                <select value={layout} onChange={(e) => setLayout(e.target.value as "horizontal" | "vertical")} style={fieldStyle()}>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
                <select
                  multiple
                  value={selectedRoleIds}
                  onChange={(e) => setSelectedRoleIds(Array.from(e.target.selectedOptions).map((option) => option.value))}
                  style={{ ...fieldStyle(), height: 110, padding: "8px 10px" }}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <input type="file" onChange={(e) => setBackgroundUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                <input type="file" onChange={(e) => setProfileUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                <input type="file" onChange={(e) => setLogoUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                <input type="file" onChange={(e) => setSignatureUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />

                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "grid", gap: 4 }}>
                  {backgroundUrl ? <a href={backgroundUrl} target="_blank" rel="noreferrer">Background file</a> : null}
                  {profileUrl ? <a href={profileUrl} target="_blank" rel="noreferrer">Profile image</a> : null}
                  {logoUrl ? <a href={logoUrl} target="_blank" rel="noreferrer">Logo</a> : null}
                  {signatureUrl ? <a href={signatureUrl} target="_blank" rel="noreferrer">Signature</a> : null}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={reset} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                <h3 style={{ margin: 0 }}>ID Card List</h3>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search" style={{ ...fieldStyle(), maxWidth: 240 }} />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Title</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Layout</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Roles</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: 12, color: "var(--text-muted)" }}>No ID cards found.</td></tr>
                    ) : (
                      filtered.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.title}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.page_layout_style}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            {(row.applicable_role_ids || [])
                              .map((id) => roleNameById.get(id) || String(id))
                              .join(", ") || "-"}
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button type="button" onClick={() => edit(row)} style={buttonStyle("#0ea5e9")}>Edit</button>
                              <button type="button" disabled={busyId === row.id} onClick={() => void remove(row.id)} style={buttonStyle("#dc2626")}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading ID cards...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
