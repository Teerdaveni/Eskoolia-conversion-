"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type Inquiry = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  query_date: string | null;
  follow_up_date: string | null;
  next_follow_up_date: string | null;
  assigned: string;
  reference: number | null;
  reference_name?: string;
  source: number | null;
  source_name?: string;
  school_class: number | null;
  class_name_resolved?: string;
  no_of_child: number;
  active_status: number;
  status: string;
  note: string;
};

type AdminSetup = {
  id: number;
  type: "1" | "2" | "3" | "4";
  name: string;
};

type SchoolClass = {
  id: number;
  name: string;
};

type InquiryForm = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  query_date: string;
  next_follow_up_date: string;
  assigned: string;
  reference: string;
  source: string;
  school_class: string;
  no_of_child: string;
  active_status: "1" | "2";
  status: string;
  note: string;
};

const initialForm = (): InquiryForm => ({
  full_name: "",
  phone: "",
  email: "",
  address: "",
  description: "",
  query_date: new Date().toISOString().slice(0, 10),
  next_follow_up_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  assigned: "",
  reference: "",
  source: "",
  school_class: "",
  no_of_child: "1",
  active_status: "1",
  status: "new",
  note: "",
});

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
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

function labelStyle() {
  return {
    display: "block",
    marginBottom: 4,
    fontSize: 12,
    color: "var(--text-muted)",
    fontWeight: 600,
  } as const;
}

export function AdmissionsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [sources, setSources] = useState<AdminSetup[]>([]);
  const [references, setReferences] = useState<AdminSetup[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<InquiryForm>(initialForm());

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowActions, setRowActions] = useState<Record<number, "" | "add_query" | "edit" | "delete">>({});

  const loadOptions = async () => {
    const [setupData, classData] = await Promise.all([
      apiRequestWithRefresh<ApiList<AdminSetup>>("/api/v1/admissions/admin-setups/"),
      apiRequestWithRefresh<ApiList<SchoolClass>>("/api/v1/core/classes/"),
    ]);

    const setupRows = listData(setupData);
    setSources(setupRows.filter((row) => row.type === "3"));
    setReferences(setupRows.filter((row) => row.type === "4"));
    setClasses(listData(classData));
  };

  const loadInquiries = async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (sourceFilter) params.set("source", sourceFilter);
    if (statusFilter) params.set("status", statusFilter);

    const query = params.toString();
    const data = await apiRequestWithRefresh<ApiList<Inquiry>>(`/api/v1/admissions/inquiries/${query ? `?${query}` : ""}`);
    setItems(listData(data));
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadOptions(), loadInquiries()]);
    } catch {
      setError("Unable to load admission query data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm());
  };

  const onChange = (key: keyof InquiryForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.query_date || !form.next_follow_up_date || !form.assigned.trim() || !form.reference || !form.source || !form.no_of_child.trim()) {
      setError("Date, next follow-up date, assigned, reference, source and number of child are required.");
      return;
    }

    if (form.phone.trim() && !/^\d{1,12}$/.test(form.phone.trim())) {
      setError(form.phone.trim().length > 12
        ? "Phone number must not exceed 12 digits."
        : "Phone number must contain digits only.");
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      description: form.description.trim(),
      query_date: form.query_date,
      next_follow_up_date: form.next_follow_up_date,
      assigned: form.assigned.trim(),
      reference: Number(form.reference),
      source: Number(form.source),
      school_class: form.school_class ? Number(form.school_class) : null,
      no_of_child: Number(form.no_of_child || 0),
      active_status: Number(form.active_status),
      status: form.status,
      note: form.note.trim(),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (editingId) {
        await apiRequestWithRefresh(`/api/v1/admissions/inquiries/${editingId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSuccess("Admission query updated successfully.");
      } else {
        await apiRequestWithRefresh("/api/v1/admissions/inquiries/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSuccess("Admission query created successfully.");
      }
      resetForm();
      await loadInquiries();
    } catch {
      setError(editingId ? "Unable to update admission query." : "Unable to create admission query.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: Inquiry) => {
    setEditingId(row.id);
    setForm({
      full_name: row.full_name || "",
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
      description: row.description || "",
      query_date: row.query_date || "",
      next_follow_up_date: row.next_follow_up_date || "",
      assigned: row.assigned || "",
      reference: row.reference ? String(row.reference) : "",
      source: row.source ? String(row.source) : "",
      school_class: row.school_class ? String(row.school_class) : "",
      no_of_child: String(row.no_of_child || 1),
      active_status: String(row.active_status || 1) as "1" | "2",
      status: row.status || "new",
      note: row.note || "",
    });
  };

  const remove = async (id: number) => {
    if (!window.confirm("Are you sure to delete this admission query?")) return;
    try {
      setDeletingId(id);
      setError("");
      setSuccess("");
      await apiRequestWithRefresh(`/api/v1/admissions/inquiries/${id}/`, { method: "DELETE" });
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Admission query deleted.");
    } catch {
      setError("Unable to delete admission query.");
    } finally {
      setDeletingId(null);
    }
  };

  const runSelectedAction = async (item: Inquiry) => {
    const action = rowActions[item.id] || "";
    if (!action) return;

    if (action === "add_query") {
      router.push(`/administration/admission-query/${item.id}`);
      return;
    }

    if (action === "edit") {
      edit(item);
      return;
    }

    if (action === "delete") {
      await remove(item.id);
    }
  };

  const selectedActionButton = (action: "" | "add_query" | "edit" | "delete") => {
    if (action === "add_query") return { label: "Add Query", color: "#0f766e" };
    if (action === "edit") return { label: "Edit", color: "#0ea5e9" };
    if (action === "delete") return { label: "Delete", color: "#dc2626" };
    return { label: "Run", color: "#94a3b8" };
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Admission Query</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span><span>/</span><span>Admin Section</span><span>/</span><span>Admission Query</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
              <div>
                <label style={labelStyle()}>Date From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={fieldStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Date To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={fieldStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Source</label>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={fieldStyle()}>
                  <option value="">Select Source</option>
                  {sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle()}>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={fieldStyle()}>
                  <option value="">Select Status</option>
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="button" onClick={() => void loadInquiries()} style={{ ...buttonStyle(), width: "100%" }}>Search</button>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Admission Query" : "Add Admission Query"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <div>
                  <label style={labelStyle()}>Name</label>
                  <input value={form.full_name} onChange={(e) => onChange("full_name", e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Phone</label>
                  <input value={form.phone} onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 12))} maxLength={12} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Address</label>
                  <textarea value={form.address} onChange={(e) => onChange("address", e.target.value)} rows={2} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={labelStyle()}>Description</label>
                  <textarea value={form.description} onChange={(e) => onChange("description", e.target.value)} rows={2} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={labelStyle()}>Query Date *</label>
                  <input type="date" value={form.query_date} onChange={(e) => onChange("query_date", e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Next Follow-up Date *</label>
                  <input type="date" value={form.next_follow_up_date} onChange={(e) => onChange("next_follow_up_date", e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Assigned *</label>
                  <input value={form.assigned} onChange={(e) => onChange("assigned", e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Reference *</label>
                  <select value={form.reference} onChange={(e) => onChange("reference", e.target.value)} style={fieldStyle()}>
                    <option value="">Select Reference</option>
                    {references.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle()}>Source *</label>
                  <select value={form.source} onChange={(e) => onChange("source", e.target.value)} style={fieldStyle()}>
                    <option value="">Select Source</option>
                    {sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle()}>Class</label>
                  <select value={form.school_class} onChange={(e) => onChange("school_class", e.target.value)} style={fieldStyle()}>
                    <option value="">Select Class</option>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle()}>No Of Child *</label>
                  <input value={form.no_of_child} onChange={(e) => onChange("no_of_child", e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Status</label>
                  <select value={form.active_status} onChange={(e) => onChange("active_status", e.target.value)} style={fieldStyle()}>
                    <option value="1">Active</option>
                    <option value="2">Inactive</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={resetForm} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Query List</h3>
              {loading ? <div style={{ color: "var(--text-muted)" }}>Loading admission queries...</div> : null}
              {!loading && items.length === 0 ? <div style={{ color: "var(--text-muted)" }}>No admission queries found.</div> : null}
              {!loading && items.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-muted)" }}>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Name</th>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Phone</th>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Source</th>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Query Date</th>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Last Follow Up</th>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Next Follow Up</th>
                      <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.full_name || "-"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.phone || "-"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.source_name || "-"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.query_date || "-"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.follow_up_date || "-"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.next_follow_up_date || "-"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--line)", minWidth: 230 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6, alignItems: "center" }}>
                            <select
                              value={rowActions[item.id] || ""}
                              onChange={(event) => setRowActions((prev) => ({ ...prev, [item.id]: event.target.value as "" | "add_query" | "edit" | "delete" }))}
                              style={fieldStyle()}
                            >
                              <option value="">Select Action</option>
                              <option value="add_query">Add Query</option>
                              <option value="edit">Edit</option>
                              <option value="delete">Delete</option>
                            </select>
                            <button
                              type="button"
                              disabled={!rowActions[item.id] || deletingId === item.id}
                              onClick={() => void runSelectedAction(item)}
                              style={buttonStyle(selectedActionButton(rowActions[item.id] || "").color)}
                            >
                              {deletingId === item.id && (rowActions[item.id] || "") === "delete"
                                ? "Deleting..."
                                : selectedActionButton(rowActions[item.id] || "").label}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>

          {error ? <p style={{ color: "var(--warning)", margin: 0 }}>{error}</p> : null}
          {success ? <p style={{ color: "#0f766e", margin: 0 }}>{success}</p> : null}
        </div>
      </section>
    </div>
  );
}
