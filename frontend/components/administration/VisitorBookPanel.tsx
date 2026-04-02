"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { TimeSpinnerPicker } from "@/components/common/TimeSpinnerPicker";

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

type VisitorRow = {
  id: number;
  purpose: string;
  name: string;
  phone?: string;
  visitor_id: string;
  no_of_person: number;
  date: string;
  in_time: string;
  out_time: string;
  file_url?: string;
  created_by_name?: string | null;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message && message !== "[object Object]") {
      return message;
    }
  }
  return fallback;
}

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

async function apiForm<T>(path: string, method: "POST" | "PATCH", formData: FormData): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method,
    body: formData,
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

export function VisitorBookPanel() {
  const [items, setItems] = useState<VisitorRow[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<number | null>(null);

  const [purpose, setPurpose] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [noOfPerson, setNoOfPerson] = useState("1");
  const [date, setDate] = useState("");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [visitorData, setupData] = await Promise.all([
        apiGet<ApiList<VisitorRow>>("/api/v1/admissions/visitors/"),
        apiGet<ApiList<AdminSetupRow>>("/api/v1/admissions/admin-setups/"),
      ]);

      setItems(listData(visitorData));
      const setups = listData(setupData);
      setPurposeOptions(setups.filter((entry) => entry.type === "1").map((entry) => ({ value: String(entry.id), label: entry.name })));
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Unable to load visitor book records."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPurpose("");
    setName("");
    setPhone("");
    setNoOfPerson("1");
    setInTime("");
    setOutTime("");
    setFileUrl("");
    setFileUpload(null);
    setFieldErrors({});
  };

  const editRow = (row: VisitorRow) => {
    const matchedPurpose = purposeOptions.find((option) => option.value === row.purpose || option.label === row.purpose);
    setEditingId(row.id);
    setPurpose(matchedPurpose?.value || row.purpose || "");
    setName(row.name || "");
    setPhone(row.phone || "");
    setNoOfPerson(String(row.no_of_person || 1));
    setDate(row.date || "");
    setInTime(row.in_time || "");
    setOutTime(row.out_time || "");
    setFileUrl(row.file_url || "");
    setFieldErrors({});
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!purpose.trim()) nextErrors.purpose = "Purpose is required.";
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!date) nextErrors.date = "Date is required.";
    if (!inTime.trim()) nextErrors.inTime = "In time is required.";
    if (!outTime.trim()) nextErrors.outTime = "Out time is required.";
    if (phone.trim() && !/^\d{1,12}$/.test(phone.trim())) {
      nextErrors.phone = phone.trim().length > 12
        ? "Phone number must not exceed 12 digits."
        : "Phone number must contain digits only.";
    }
    if (inTime.trim() && outTime.trim() && outTime.trim() < inTime.trim()) {
      nextErrors.outTime = "Out time must be later than or equal to in time.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Purpose, name, date, in time and out time are required.");
      return;
    }

    const formData = new FormData();
    formData.append("purpose", purpose.trim());
    formData.append("name", name.trim());
    formData.append("phone", phone.trim());
    formData.append("no_of_person", String(Number(noOfPerson) || 1));
    formData.append("date", date);
    formData.append("in_time", inTime.trim());
    formData.append("out_time", outTime.trim());
    if (fileUpload) {
      formData.append("file_upload", fileUpload);
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setFieldErrors({});

      if (editingId) {
        await apiForm(`/api/v1/admissions/visitors/${editingId}/`, "PATCH", formData);
        setSuccess("Visitor updated successfully.");
      } else {
        await apiForm("/api/v1/admissions/visitors/", "POST", formData);
        setSuccess("Visitor added successfully.");
      }

      resetForm();
      await load();
    } catch (error: unknown) {
      setError(getErrorMessage(error, editingId ? "Unable to update visitor." : "Unable to add visitor."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this visitor record?");
    if (!ok) {
      return;
    }

    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/visitors/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Visitor record deleted.");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Unable to delete visitor record."));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((row) =>
      [row.name, row.purpose, row.phone || "", row.visitor_id]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Visitor Book</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Visitor Book</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Visitor" : "Add Visitor"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <select
                  aria-label="Purpose"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (fieldErrors.purpose) setFieldErrors((prev) => ({ ...prev, purpose: "" }));
                  }}
                  style={{ ...fieldStyle(), borderColor: fieldErrors.purpose ? "#dc2626" : "var(--line)" }}
                >
                  <option value="">Select Purpose *</option>
                  {purposeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.purpose ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.purpose}</span> : null}
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Name *"
                  style={{ ...fieldStyle(), borderColor: fieldErrors.name ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.name ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.name}</span> : null}
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 12));
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  placeholder="Phone"
                  maxLength={12}
                  style={{ ...fieldStyle(), borderColor: fieldErrors.phone ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.phone ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.phone}</span> : null}
                <input type="number" min={1} value={noOfPerson} onChange={(e) => setNoOfPerson(e.target.value)} placeholder="No of Person *" style={fieldStyle()} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: "" }));
                  }}
                  style={{ ...fieldStyle(), borderColor: fieldErrors.date ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.date ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.date}</span> : null}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", fontWeight: 600 }}>In Time</label>
                    <TimeSpinnerPicker value={inTime} onChange={(v) => {
                      setInTime(v);
                      if (fieldErrors.inTime) setFieldErrors((prev) => ({ ...prev, inTime: "" }));
                    }} />
                    {fieldErrors.inTime ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.inTime}</span> : null}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", fontWeight: 600 }}>Out Time</label>
                    <TimeSpinnerPicker value={outTime} onChange={(v) => {
                      setOutTime(v);
                      if (fieldErrors.outTime) setFieldErrors((prev) => ({ ...prev, outTime: "" }));
                    }} />
                    {fieldErrors.outTime ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.outTime}</span> : null}
                  </div>
                </div>
                <input type="file" onChange={(e) => setFileUpload(e.target.files?.[0] || null)} style={{ ...fieldStyle(), padding: 6 }} />
                {editingId && fileUrl ? (
                  <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: 12 }}>
                    View existing file
                  </a>
                ) : null}

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>
                    {saving ? "Saving..." : editingId ? "Update" : "Save"}
                  </button>
                  {editingId ? (
                    <button type="button" onClick={resetForm} style={buttonStyle("#6b7280")}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                <h3 style={{ margin: 0 }}>Visitor List</h3>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Quick search"
                  style={{ ...fieldStyle(), maxWidth: 240 }}
                />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>SL</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Name</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>No Of Person</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Phone</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Purpose</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Date</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>In Time</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Out Time</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Created By</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: 12, color: "var(--text-muted)" }}>
                          No visitor records found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, index) => (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{index + 1}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.no_of_person}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.phone || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.purpose}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.date}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.in_time}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.out_time}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.created_by_name || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button type="button" onClick={() => editRow(row)} style={buttonStyle("#0ea5e9")}>
                                Edit
                              </button>
                              <button type="button" disabled={busyId === row.id} onClick={() => void remove(row.id)} style={buttonStyle("#dc2626")}>
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

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading visitor records...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
