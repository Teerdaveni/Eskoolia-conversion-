"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const STATUSES = ["new", "contacted", "visited", "enrolled", "declined"] as const;
type InquiryStatus = (typeof STATUSES)[number];

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new: "#6366f1",
  contacted: "#f59e0b",
  visited: "#3b82f6",
  enrolled: "#22c55e",
  declined: "#ef4444",
};

type FollowUp = {
  id: number;
  author_name: string | null;
  note: string;
  status_after: string;
  created_at: string;
};

type Inquiry = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  class_name: string;
  status: string;
  created_at: string;
  follow_ups: FollowUp[];
};

type InquiryListResponse = {
  results?: Inquiry[];
};

export function AdmissionsPanel() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Create inquiry form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("");
  const [note, setNote] = useState("");

  // Expanded inquiry for timeline
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Follow-up form
  const [followNote, setFollowNote] = useState("");
  const [followStatus, setFollowStatus] = useState<InquiryStatus | "">("");
  const [addingFollowUp, setAddingFollowUp] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const loadInquiries = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admissions/inquiries/`, {
        cache: "no-store",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = (await response.json()) as InquiryListResponse | Inquiry[];
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("Unable to load admissions. Ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const submitInquiry = async (event: FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !phone.trim() || !className.trim()) {
      setError("Full name, phone, and class are required.");
      return;
    }
    if (!getAccessToken()) {
      setError("Login is required before creating inquiries.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/v1/admissions/inquiries/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          class_name: className.trim(),
          note: note.trim(),
          status: "new",
        }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setFullName(""); setPhone(""); setEmail(""); setClassName(""); setNote("");
      await loadInquiries();
    } catch {
      setError("Unable to create inquiry. Verify auth and school context.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (inquiryId: number, newStatus: InquiryStatus) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admissions/inquiries/${inquiryId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) await loadInquiries();
  };

  const submitFollowUp = async (event: FormEvent) => {
    event.preventDefault();
    if (!followNote.trim() || selectedId === null) return;
    try {
      setAddingFollowUp(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/admissions/follow-ups/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          inquiry: selectedId,
          note: followNote.trim(),
          status_after: followStatus || undefined,
        }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setFollowNote(""); setFollowStatus("");
      await loadInquiries();
    } catch {
      setError("Unable to save follow-up.");
    } finally {
      setAddingFollowUp(false);
    }
  };

  const selectedInquiry = items.find((i) => i.id === selectedId) || null;

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Admissions</h1>
        <p style={{ marginTop: 8, color: "var(--text-muted)" }}>Capture and track admission inquiries.</p>
      </div>

      {/* Create inquiry form */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10 }}>New Inquiry</div>
        <form onSubmit={submitInquiry} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" style={{ height: 38, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ height: 38, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ height: 38, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
          <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Interested class" style={{ height: 38, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" }} />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes" rows={2} style={{ gridColumn: "1 / -1", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" disabled={submitting} style={{ border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
              {submitting ? "Savingâ€¦" : "Create Inquiry"}
            </button>
          </div>
        </form>
      </div>

      {error && <div style={{ padding: "10px 14px", color: "var(--warning)", marginBottom: 10 }}>{error}</div>}

      {/* Split layout: list left, timeline right */}
      <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 380px" : "1fr", gap: 14 }}>
        {/* Inquiry list */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>Inquiry List</div>
          {loading && <div style={{ padding: 14, color: "var(--text-muted)" }}>Loading admissionsâ€¦</div>}
          {!loading && items.length === 0 && <div style={{ padding: 14, color: "var(--text-muted)" }}>No admissions found yet.</div>}
          {!loading && items.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Name</th>
                  <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Phone</th>
                  <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Class</th>
                  <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Status</th>
                  <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Created</th>
                  <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const active = selectedId === item.id;
                  const color = STATUS_COLORS[item.status as InquiryStatus] ?? "#888";
                  return (
                    <tr key={item.id} style={{ background: active ? "var(--surface-muted)" : undefined }}>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.full_name}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.phone}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{item.class_name}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                        <select
                          value={item.status}
                          onChange={(e) => changeStatus(item.id, e.target.value as InquiryStatus)}
                          style={{ border: `1px solid ${color}`, color, borderRadius: 6, padding: "2px 6px", fontSize: 13, background: "transparent", cursor: "pointer" }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--text-muted)" }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                        <button
                          onClick={() => setSelectedId(active ? null : item.id)}
                          style={{ fontSize: 12, border: "1px solid var(--line)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", background: active ? "var(--primary)" : "transparent", color: active ? "#fff" : "inherit" }}
                        >
                          {active ? "Close" : "Timeline"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Follow-up timeline panel */}
        {selectedInquiry && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>
              Timeline â€” {selectedInquiry.full_name}
            </div>

            {/* Timeline entries */}
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedInquiry.follow_ups.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No follow-ups yet. Add the first one below.</p>
              )}
              {selectedInquiry.follow_ups.map((fu) => (
                <div key={fu.id} style={{ background: "var(--surface-muted)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                    <span>{fu.author_name ?? "System"}</span>
                    <span>{new Date(fu.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14 }}>{fu.note}</p>
                  {fu.status_after && (
                    <span style={{ fontSize: 12, marginTop: 4, display: "inline-block", color: STATUS_COLORS[fu.status_after as InquiryStatus] ?? "#888" }}>
                      â†’ Status: {fu.status_after}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Add follow-up form */}
            <form onSubmit={submitFollowUp} style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                value={followNote}
                onChange={(e) => setFollowNote(e.target.value)}
                placeholder="Follow-up noteâ€¦"
                rows={3}
                style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", resize: "vertical", fontSize: 14 }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={followStatus}
                  onChange={(e) => setFollowStatus(e.target.value as InquiryStatus | "")}
                  style={{ flex: 1, height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 8px", fontSize: 13 }}
                >
                  <option value="">â€” no status change â€”</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={addingFollowUp || !followNote.trim()}
                  style={{ height: 36, padding: "0 16px", border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
                >
                  {addingFollowUp ? "Savingâ€¦" : "Add"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
