"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type FollowUp = {
  id: number;
  author_name: string | null;
  response: string;
  note: string;
  created_at: string;
};

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
  reference_name?: string;
  source_name?: string;
  created_by_name?: string;
  active_status: number;
  follow_ups: FollowUp[];
};

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

export function AdmissionFollowUpPanel({ inquiryId }: { inquiryId: number }) {
  const router = useRouter();
  const [item, setItem] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [activeStatus, setActiveStatus] = useState<"1" | "2">("1");
  const [response, setResponse] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequestWithRefresh<Inquiry>(`/api/v1/admissions/inquiries/${inquiryId}/`);
      setItem(data);
      setNextFollowUpDate(data.next_follow_up_date || "");
      setActiveStatus(String(data.active_status || 1) as "1" | "2");
    } catch {
      setError("Unable to load admission query details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [inquiryId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!response.trim()) {
      setError("Response is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await apiRequestWithRefresh("/api/v1/admissions/follow-ups/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry: inquiryId,
          response: response.trim(),
          note: note.trim(),
          next_follow_up_date: nextFollowUpDate || null,
          active_status: Number(activeStatus),
        }),
      });
      setResponse("");
      setNote("");
      setSuccess("Follow-up saved successfully.");
      await load();
    } catch {
      setError("Unable to save follow-up.");
    } finally {
      setSaving(false);
    }
  };

  const removeFollowUp = async (id: number) => {
    if (!window.confirm("Are you sure to delete this follow-up?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/admissions/follow-ups/${id}/`, { method: "DELETE" });
      await load();
    } catch {
      setError("Unable to delete follow-up.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Follow Up</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <button type="button" onClick={() => router.push("/administration/admission-query")} style={{ border: 0, background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>Admission Query</button>
              <span>/</span><span>Follow Up</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Follow Up Admission Query</h3>
              <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                  <input type="date" value={item?.next_follow_up_date || ""} readOnly style={fieldStyle()} />
                  <input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} style={fieldStyle()} />
                  <select value={activeStatus} onChange={(e) => setActiveStatus(e.target.value as "1" | "2")} style={fieldStyle()}>
                    <option value="1">Active</option>
                    <option value="2">Inactive</option>
                  </select>
                </div>
                <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Response *" rows={3} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" rows={3} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
                <div>
                  <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : "Save"}</button>
                </div>
              </form>

              <h3 style={{ marginTop: 20, marginBottom: 12 }}>Follow Up List</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-muted)" }}>
                    <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Query By</th>
                    <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Response</th>
                    <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Note</th>
                    <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid var(--line)" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(item?.follow_ups || []).map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{row.author_name || "-"}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{row.response || "-"}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{row.note || "-"}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                        <button type="button" onClick={() => void removeFollowUp(row.id)} style={buttonStyle("#dc2626")}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="white-box" style={boxStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Details</h3>
              {loading ? <div style={{ color: "var(--text-muted)" }}>Loading details...</div> : null}
              {item ? (
                <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                  <div><strong>Created By:</strong> {item.created_by_name || "-"}</div>
                  <div><strong>Query Date:</strong> {item.query_date || "-"}</div>
                  <div><strong>Last Follow Up Date:</strong> {item.follow_up_date || "-"}</div>
                  <div><strong>Next Follow Up Date:</strong> {item.next_follow_up_date || "-"}</div>
                  <div><strong>Phone:</strong> {item.phone || "-"}</div>
                  <div><strong>Address:</strong> {item.address || "-"}</div>
                  <div><strong>Reference:</strong> {item.reference_name || "-"}</div>
                  <div><strong>Description:</strong> {item.description || "-"}</div>
                  <div><strong>Source:</strong> {item.source_name || "-"}</div>
                  <div><strong>Assigned:</strong> {item.assigned || "-"}</div>
                  <div><strong>Email:</strong> {item.email || "-"}</div>
                </div>
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
