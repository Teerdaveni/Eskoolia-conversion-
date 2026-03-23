"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type CertificateRow = {
  id: number;
  type: "School" | "Lms";
  title: string;
  applicable_role_id?: number | null;
  body: string;
  background_height: string;
  background_width: string;
  padding_top: string;
  padding_right: string;
  padding_bottom: string;
  pading_left: string;
  background_url?: string;
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

export function CertificatePanel() {
  const [items, setItems] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<"School" | "Lms">("School");
  const [title, setTitle] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [body, setBody] = useState("");
  const [height, setHeight] = useState("144");
  const [width, setWidth] = useState("165");
  const [pt, setPt] = useState("5");
  const [pr, setPr] = useState("5");
  const [pb, setPb] = useState("5");
  const [pl, setPl] = useState("5");
  const [backgroundUpload, setBackgroundUpload] = useState<File | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [templateData, roleData] = await Promise.all([
        apiGet<ApiList<CertificateRow>>("/api/v1/admissions/certificate-templates/"),
        apiGet<ApiList<RoleOption>>("/api/v1/access-control/roles/"),
      ]);
      setItems(listData(templateData));
      setRoles(listData(roleData));
    } catch {
      setError("Unable to load certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setType("School");
    setTitle("");
    setRoleId("");
    setBody("");
    setHeight("144");
    setWidth("165");
    setPt("5");
    setPr("5");
    setPb("5");
    setPl("5");
    setBackgroundUpload(null);
    setBackgroundUrl("");
  };

  const edit = (row: CertificateRow) => {
    setEditingId(row.id);
    setType((row.type || "School") as "School" | "Lms");
    setTitle(row.title || "");
    setRoleId(row.applicable_role_id ? String(row.applicable_role_id) : "");
    setBody(row.body || "");
    setHeight(String(row.background_height || "144"));
    setWidth(String(row.background_width || "165"));
    setPt(String(row.padding_top || "5"));
    setPr(String(row.padding_right || "5"));
    setPb(String(row.padding_bottom || "5"));
    setPl(String(row.pading_left || "5"));
    setBackgroundUpload(null);
    setBackgroundUrl(row.background_url || "");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Certificate title and body are required.");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("title", title.trim());
    if (roleId.trim()) formData.append("applicable_role_id", roleId.trim());
    formData.append("body", body.trim());
    formData.append("background_height", height);
    formData.append("background_width", width);
    formData.append("padding_top", pt);
    formData.append("padding_right", pr);
    formData.append("padding_bottom", pb);
    formData.append("pading_left", pl);
    if (backgroundUpload) formData.append("background_upload", backgroundUpload);

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (editingId) {
        await apiForm(`/api/v1/admissions/certificate-templates/${editingId}/`, "PATCH", formData);
        setSuccess("Certificate updated successfully.");
      } else {
        await apiForm("/api/v1/admissions/certificate-templates/", "POST", formData);
        setSuccess("Certificate saved successfully.");
      }
      reset();
      await load();
    } catch {
      setError(editingId ? "Unable to update certificate." : "Unable to save certificate.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this certificate template?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/certificate-templates/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Certificate deleted.");
    } catch {
      setError("Unable to delete certificate.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => [row.title, row.type, row.body].join(" ").toLowerCase().includes(q));
  }, [items, search]);

  const roleNameById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Certificate</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Certificate</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Certificate" : "Create Certificate"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <select value={type} onChange={(e) => setType(e.target.value as "School" | "Lms")} style={fieldStyle()}>
                  <option value="School">School</option>
                  <option value="Lms">Lms</option>
                </select>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate Title *" style={fieldStyle()} />
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={fieldStyle()}>
                  <option value="">All roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Certificate Body *" rows={5} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height (mm)" style={fieldStyle()} />
                  <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Width (mm)" style={fieldStyle()} />
                  <input value={pt} onChange={(e) => setPt(e.target.value)} placeholder="Padding Top" style={fieldStyle()} />
                  <input value={pr} onChange={(e) => setPr(e.target.value)} placeholder="Padding Right" style={fieldStyle()} />
                  <input value={pb} onChange={(e) => setPb(e.target.value)} placeholder="Padding Bottom" style={fieldStyle()} />
                  <input value={pl} onChange={(e) => setPl(e.target.value)} placeholder="Padding Left" style={fieldStyle()} />
                </div>

                <input type="file" onChange={(e) => setBackgroundUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                {backgroundUrl ? <a href={backgroundUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: 12 }}>View existing background</a> : null}

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={reset} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                <h3 style={{ margin: 0 }}>Certificate List</h3>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search" style={{ ...fieldStyle(), maxWidth: 240 }} />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Title</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Type</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Role</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Created</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 12, color: "var(--text-muted)" }}>No certificates found.</td></tr>
                    ) : (
                      filtered.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.title}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.type}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            {row.applicable_role_id ? (roleNameById.get(row.applicable_role_id) || String(row.applicable_role_id)) : "-"}
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{"-"}</td>
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

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading certificates...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
