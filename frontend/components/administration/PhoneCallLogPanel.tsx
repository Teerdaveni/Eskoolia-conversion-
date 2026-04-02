"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type PhoneCallRow = {
  id: number;
  name?: string;
  phone: string;
  date?: string;
  next_follow_up_date?: string;
  call_duration?: string;
  description?: string;
  call_type: "I" | "O";
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

function formatCallDuration(duration: string): string {
  if (!duration) return "-";
  // If already in HH:MM:SS format, return as is
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(duration)) {
    return duration;
  }
  // If just seconds, format to HH:MM:SS
  if (/^\d+$/.test(duration)) {
    const seconds = parseInt(duration, 10);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return duration;
}

export function PhoneCallLogPanel() {
  const [items, setItems] = useState<PhoneCallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string }>({});
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [description, setDescription] = useState("");
  const [callType, setCallType] = useState<"I" | "O">("I");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<ApiList<PhoneCallRow>>("/api/v1/admissions/phone-call-logs/");
      setItems(listData(data));
    } catch {
      setError("Unable to load phone call logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    setFollowUpDate(today);
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setCallDuration("");
    setDescription("");
    setCallType("I");
    setFieldErrors({});
  };

  const edit = (row: PhoneCallRow) => {
    setEditingId(row.id);
    setName(row.name || "");
    setPhone(row.phone || "");
    setDate(row.date || "");
    setFollowUpDate(row.next_follow_up_date || "");
    setCallDuration(row.call_duration || "");
    setDescription(row.description || "");
    setCallType((row.call_type || "I") as "I" | "O");
    setFieldErrors({});
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: { phone?: string } = {};
    if (!phone.trim()) {
      nextErrors.phone = "Phone is required.";
    } else if (!/^\d{1,12}$/.test(phone.trim())) {
      nextErrors.phone = phone.trim().length > 12
        ? "Phone number must not exceed 12 digits."
        : "Phone number must contain digits only.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Phone is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      date: date || null,
      next_follow_up_date: followUpDate || null,
      call_duration: callDuration.trim(),
      description: description.trim(),
      call_type: callType,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setFieldErrors({});
      if (editingId) {
        await apiMutate(`/api/v1/admissions/phone-call-logs/${editingId}/`, "PATCH", payload);
        setSuccess("Phone call updated successfully.");
      } else {
        await apiMutate("/api/v1/admissions/phone-call-logs/", "POST", payload);
        setSuccess("Phone call saved successfully.");
      }
      reset();
      await load();
    } catch {
      setError(editingId ? "Unable to update phone call." : "Unable to save phone call.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm("Are you sure to delete this phone call log?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError("");
      setSuccess("");
      await apiDelete(`/api/v1/admissions/phone-call-logs/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setSuccess("Phone call deleted.");
    } catch {
      setError("Unable to delete phone call.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [row.name || "", row.phone, row.call_duration || "", row.description || "", row.call_type === "I" ? "incoming" : "outgoing"]
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
            <h1 style={{ margin: 0, fontSize: 24 }}>Phone Call Log</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Phone Call Log</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0">
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Phone Call" : "Add Phone Call"}</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={fieldStyle()} />
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 12));
                    if (fieldErrors.phone) setFieldErrors({});
                  }}
                  placeholder="Phone *"
                  maxLength={12}
                  style={{ ...fieldStyle(), borderColor: fieldErrors.phone ? "#dc2626" : "var(--line)" }}
                />
                {fieldErrors.phone ? <span style={{ fontSize: 12, color: "#dc2626" }}>{fieldErrors.phone}</span> : null}
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>From Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>To Date</label>
                  <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} style={fieldStyle()} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Call Duration (HH:MM:SS)</label>
                  <input value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="HH:MM:SS" style={fieldStyle()} />
                </div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />

                <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" value="I" checked={callType === "I"} onChange={() => setCallType("I")} />
                    Incoming
                  </label>
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" value="O" checked={callType === "O"} onChange={() => setCallType("O")} />
                    Outgoing
                  </label>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
                  {editingId ? <button type="button" onClick={reset} style={buttonStyle("#6b7280")}>Cancel</button> : null}
                </div>
              </form>
            </div>

            <div className="white-box" style={boxStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                <h3 style={{ margin: 0 }}>Phone Call List</h3>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search" style={{ ...fieldStyle(), maxWidth: 240 }} />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Name</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Phone</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>From Date</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>To Date</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Call Duration</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Description</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Call Type</th>
                      <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 12, color: "var(--text-muted)" }}>No phone calls found.</td></tr>
                    ) : (
                      filtered.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.phone}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.date || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.next_follow_up_date || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{formatCallDuration(row.call_duration || "")}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.description || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.call_type === "I" ? "Incoming" : "Outgoing"}</td>
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

              {loading && <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Loading phone calls...</p>}
              {error && <p style={{ marginTop: 10, color: "var(--warning)" }}>{error}</p>}
              {success && <p style={{ marginTop: 10, color: "#0f766e" }}>{success}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
