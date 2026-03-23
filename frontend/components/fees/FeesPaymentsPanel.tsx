"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { feesApi, FeesAssignment, FeesPayment, StudentRow, listData } from "@/lib/fees-api";

function field() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function btn(color = "var(--primary)") {
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

export default function FeesPaymentsPanel() {
  const [assignments, setAssignments] = useState<FeesAssignment[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [payments, setPayments] = useState<FeesPayment[]>([]);

  const [assignmentId, setAssignmentId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [method, setMethod] = useState<"cash" | "bank" | "online" | "wallet" | "cheque">("cash");
  const [transactionReference, setTransactionReference] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [error, setError] = useState("");

  const [receiptPreview, setReceiptPreview] = useState<Record<string, unknown> | null>(null);

  const load = async () => {
    const [assignmentData, paymentData, studentData] = await Promise.all([
      feesApi.listAssignments(),
      feesApi.listPayments(),
      feesApi.listStudents(),
    ]);
    setAssignments(listData(assignmentData));
    setPayments(listData(paymentData));
    setStudents(listData(studentData));
  };

  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setPaidAt(local);
    void load();
  }, []);

  const selectedAssignment = useMemo(
    () => assignments.find((row) => row.id === Number(assignmentId)),
    [assignments, assignmentId],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !amountPaid || !paidAt) {
      setError("Assignment, paid amount and paid time are required.");
      return;
    }
    try {
      setError("");
      await feesApi.createPayment({
        assignment: Number(assignmentId),
        student: selectedAssignment?.student,
        amount_paid: amountPaid,
        method,
        transaction_reference: transactionReference,
        note,
        paid_at: new Date(paidAt).toISOString(),
      });
      setAssignmentId("");
      setAmountPaid("");
      setMethod("cash");
      setTransactionReference("");
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment save failed.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20"><div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Fees Collection</h1></div></section>
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Add Payment</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1.5fr 140px 120px 180px 1fr 1fr auto", gap: 8 }}>
            <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} style={field()}>
              <option value="">Select assignment</option>
              {assignments.map((it) => (
                <option key={it.id} value={it.id}>
                  #{it.id} - Student {it.student} - Type {it.fees_type} - Due {it.amount}
                </option>
              ))}
            </select>
            <input value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Amount" style={field()} />
            <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "bank" | "online" | "wallet" | "cheque")} style={field()}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="online">Online</option>
              <option value="wallet">Wallet</option>
              <option value="cheque">Cheque</option>
            </select>
            <input value={paidAt} onChange={(e) => setPaidAt(e.target.value)} type="datetime-local" style={field()} />
            <input value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} placeholder="Transaction Ref" style={field()} />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" style={field()} />
            <button type="submit" style={btn()}>Save</button>
          </form>
          {selectedAssignment && (
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--muted)" }}>
              Selected assignment status: {selectedAssignment.status}, discount: {selectedAssignment.discount_amount}
            </p>
          )}
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Payments</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Assignment</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Amount</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Method</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Paid At</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {payments.map((row) => {
                const student = students.find((it) => it.id === row.student);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>#{row.assignment}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student ? `${student.first_name || ""} ${student.last_name || ""}` : row.student}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.amount_paid}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.method}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{new Date(row.paid_at).toLocaleString()}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" style={btn("#0ea5e9")} onClick={() => void feesApi.paymentReceipt(row.id).then(setReceiptPreview).catch((e) => setError(e instanceof Error ? e.message : "Receipt load failed."))}>Receipt</button>
                        <button type="button" style={btn("#dc2626")} onClick={() => void feesApi.deletePayment(row.id).then(load).catch((e) => setError(e instanceof Error ? e.message : "Delete failed."))}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {receiptPreview && (
          <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Receipt Preview</h3>
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>{JSON.stringify(receiptPreview, null, 2)}</pre>
          </div>
        )}
      </div></section>
    </div>
  );
}
