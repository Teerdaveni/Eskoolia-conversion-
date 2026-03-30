"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type PostalReceiveRow = {
  id: number;
  from_title: string;
  reference_no: string;
  address: string;
  note?: string;
  to_title: string;
  date?: string;
  file_url?: string;
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

export function PostalReceivePanel() {
  const [items, setItems] = useState<PostalReceiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [fromTitle, setFromTitle] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [toTitle, setToTitle] = useState("");
  const [date, setDate] = useState("");
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<ApiList<PostalReceiveRow>>("/api/v1/admissions/postal-receive/");
      setItems(listData(data));
    } catch {
      setError("Unable to load postal receive records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setFromTitle("");
    setReferenceNo("");
    setAddress("");
    setNote("");
    setToTitle("");
    setFileUpload(null);
    setFileUrl("");
    setFieldErrors({});
  };

  const edit = (row: PostalReceiveRow) => {
    setEditingId(row.id);
    setFromTitle(row.from_title || "");
    setReferenceNo(row.reference_no || "");
    setAddress(row.address || "");
    setNote(row.note || "");
    setToTitle(row.to_title || "");
    setDate(row.date || "");
    setFileUpload(null);
    setFileUrl(row.file_url || "");
    setFieldErrors({});
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!fromTitle.trim()) nextErrors.fromTitle = "From title is required.";
    if (!referenceNo.trim()) nextErrors.referenceNo = "Reference number is required.";
    if (!address.trim()) nextErrors.address = "Address is required.";
    if (!toTitle.trim()) nextErrors.toTitle = "To title is required.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("From title, reference no, address and to title are required.");
      return;
    }

    const formData = new FormData();
    formData.append("from_title", fromTitle.trim());
    formData.append("reference_no", referenceNo.trim());
    formData.append("address", address.trim());
    formData.append("note", note.trim());
    formData.append("to_title", toTitle.trim());
    if (date) formData.append("date", date);
    if (fileUpload) formData.append("file_upload", fileUpload);

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setFieldErrors({});
      if (editingId) {
        await apiForm(`/api/v1/admissions/postal-receive/${editingId}/`, "PATCH", formData);
        setSuccess("Postal receive updated successfully.");
      } else {
        await apiForm("/api/v1/admissions/postal-receive/", "POST", formData);
        setSuccess("Postal receive saved successfully.");
      }
      reset();
      await load();
    } catch {
      setError(editingId ? "Unable to update postal receive." : "Unable to save postal receive.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this postal receive entry?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/postal-receive/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Postal receive deleted.");
    } catch {
      setError("Unable to delete postal receive.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [row.from_title, row.reference_no, row.address, row.to_title, row.note || ""].join(" ").toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Postal Receive</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Postal Receive</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Postal Receive" : "Add Postal Receive"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <input
                  value={fromTitle}
                  onChange={(e) => {
                    setFromTitle(e.target.value);
                    if (fieldErrors.fromTitle) setFieldErrors((prev) => ({ ...prev, fromTitle: "" }));
                  }}
                  placeholder="From Title *"
                  style={{ ...fieldStyle(), borderColor: fieldErrors.fromTitle ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.fromTitle ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.fromTitle}</span> : null}
                <input
                  value={referenceNo}
                  onChange={(e) => {
                    setReferenceNo(e.target.value);
                    if (fieldErrors.referenceNo) setFieldErrors((prev) => ({ ...prev, referenceNo: "" }));
                  }}
                  placeholder="Reference No *"
                  style={{ ...fieldStyle(), borderColor: fieldErrors.referenceNo ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.referenceNo ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.referenceNo}</span> : null}
                <input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="Address *"
                  style={{ ...fieldStyle(), borderColor: fieldErrors.address ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.address ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.address}</span> : null}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" rows={3} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
                <input
                  value={toTitle}
                  onChange={(e) => {
                    setToTitle(e.target.value);
                    if (fieldErrors.toTitle) setFieldErrors((prev) => ({ ...prev, toTitle: "" }));
                  }}
                  placeholder="To Title *"
                  style={{ ...fieldStyle(), borderColor: fieldErrors.toTitle ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.toTitle ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.toTitle}</span> : null}
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle()} />
                <input type="file" onChange={(e) => setFileUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                {editingId && fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: 12 }}>View existing file</a> : null}

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={reset} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                <h3 style={{ margin: 0 }}>Postal Receive List</h3>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search" style={{ ...fieldStyle(), maxWidth: 240 }} />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>From Title</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Reference No</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Address</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>To Title</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Note</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Date</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 12, color: "var(--text-muted)" }}>No postal receive records found.</td></tr>
                    ) : (
                      filtered.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.from_title}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.reference_no}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.address}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.to_title}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.note || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.date || "-"}</td>
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

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading postal receive...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
