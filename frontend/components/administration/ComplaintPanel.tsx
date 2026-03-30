"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type AdminSetupRow = {
  id: number;
  type: "1" | "2" | "3" | "4";
  name: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type ComplaintRow = {
  id: number;
  complaint_by: string;
  complaint_type: string;
  complaint_source: string;
  phone?: string;
  date?: string;
  action_taken?: string;
  assigned?: string;
  description?: string;
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

export function ComplaintPanel() {
  const [items, setItems] = useState<ComplaintRow[]>([]);
  const [complaintTypeOptions, setComplaintTypeOptions] = useState<SelectOption[]>([]);
  const [complaintSourceOptions, setComplaintSourceOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [complaintBy, setComplaintBy] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [complaintSource, setComplaintSource] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [assigned, setAssigned] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [complaintData, setupData] = await Promise.all([
        apiGet<ApiList<ComplaintRow>>("/api/v1/admissions/complaints/"),
        apiGet<ApiList<AdminSetupRow>>("/api/v1/admissions/admin-setups/"),
      ]);
      setItems(listData(complaintData));

      const setups = listData(setupData);
      setComplaintTypeOptions(
        setups.filter((entry) => entry.type === "2").map((entry) => ({ value: String(entry.id), label: entry.name })),
      );
      setComplaintSourceOptions(
        setups.filter((entry) => entry.type === "3").map((entry) => ({ value: String(entry.id), label: entry.name })),
      );
    } catch {
      setError("Unable to load complaints.");
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
    setComplaintBy("");
    setComplaintType("");
    setComplaintSource("");
    setPhone("");
    setActionTaken("");
    setAssigned("");
    setDescription("");
    setFileUpload(null);
    setFileUrl("");
  };

  const edit = (row: ComplaintRow) => {
    const matchedType = complaintTypeOptions.find((option) => option.value === row.complaint_type || option.label === row.complaint_type);
    const matchedSource = complaintSourceOptions.find((option) => option.value === row.complaint_source || option.label === row.complaint_source);

    setEditingId(row.id);
    setComplaintBy(row.complaint_by || "");
    setComplaintType(matchedType?.value || "");
    setComplaintSource(matchedSource?.value || "");
    setPhone(row.phone || "");
    setDate(row.date || "");
    setActionTaken(row.action_taken || "");
    setAssigned(row.assigned || "");
    setDescription(row.description || "");
    setFileUpload(null);
    setFileUrl(row.file_url || "");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!complaintBy.trim() || !complaintType.trim() || !complaintSource.trim()) {
      setError("Complaint by, complaint type and source are required.");
      return;
    }

    const formData = new FormData();
    formData.append("complaint_by", complaintBy.trim());
    formData.append("complaint_type", complaintType.trim());
    formData.append("complaint_source", complaintSource.trim());
    formData.append("phone", phone.trim());
    if (date) formData.append("date", date);
    formData.append("action_taken", actionTaken.trim());
    formData.append("assigned", assigned.trim());
    formData.append("description", description.trim());
    if (fileUpload) formData.append("file_upload", fileUpload);

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (editingId) {
        await apiForm(`/api/v1/admissions/complaints/${editingId}/`, "PATCH", formData);
        setSuccess("Complaint updated successfully.");
      } else {
        await apiForm("/api/v1/admissions/complaints/", "POST", formData);
        setSuccess("Complaint added successfully.");
      }
      reset();
      await load();
    } catch {
      setError(editingId ? "Unable to update complaint." : "Unable to add complaint.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this complaint?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/complaints/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Complaint deleted.");
    } catch {
      setError("Unable to delete complaint.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [row.complaint_by, row.complaint_type, row.complaint_source, row.phone || ""].join(" ").toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Complaint</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Complaint</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Complaint" : "Add Complaint"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <input value={complaintBy} onChange={(e) => setComplaintBy(e.target.value)} placeholder="Complaint By *" style={fieldStyle()} />
                <select aria-label="Complaint Type" value={complaintType} onChange={(e) => setComplaintType(e.target.value)} style={fieldStyle()}>
                  <option value="">Select Complaint Type *</option>
                  {complaintTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select aria-label="Complaint Source" value={complaintSource} onChange={(e) => setComplaintSource(e.target.value)} style={fieldStyle()}>
                  <option value="">Select Complaint Source *</option>
                  {complaintSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={fieldStyle()} />
                <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle()} />
                <input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Action Taken" style={fieldStyle()} />
                <input value={assigned} onChange={(e) => setAssigned(e.target.value)} placeholder="Assigned" style={fieldStyle()} />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
                <input aria-label="Complaint Attachment" type="file" onChange={(e) => setFileUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                {editingId && fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: 12 }}>View existing file</a> : null}

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={reset} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                <h3 style={{ margin: 0 }}>Complaint List</h3>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search" style={{ ...fieldStyle(), maxWidth: 240 }} />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>SL</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Complaint By</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Complaint Type</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Source</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Phone</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Date</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 12, color: "var(--text-muted)" }}>No complaints found.</td></tr>
                    ) : (
                      filtered.map((row, index) => (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{index + 1}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.complaint_by}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.complaint_type}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.complaint_source}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.phone || "-"}</td>
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

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading complaints...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
