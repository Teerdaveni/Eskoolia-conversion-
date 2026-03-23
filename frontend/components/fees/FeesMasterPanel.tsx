"use client";

import { FormEvent, useEffect, useState } from "react";
import { feesApi, FeesAssignment, FeesType, StudentRow, AcademicYear, listData } from "@/lib/fees-api";

function field() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function btn(color = "var(--primary)") {
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

export default function FeesMasterPanel() {
  const [rows, setRows] = useState<FeesAssignment[]>([]);
  const [types, setTypes] = useState<FeesType[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const [yearId, setYearId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const [aData, tData, sData, yData] = await Promise.all([
      feesApi.listAssignments(),
      feesApi.listTypes(),
      feesApi.listStudents(),
      feesApi.listAcademicYears(),
    ]);
    const y = listData(yData);
    setRows(listData(aData));
    setTypes(listData(tData));
    setStudents(listData(sData));
    setYears(y);
    if (!yearId) {
      const current = y.find((it) => it.is_current) || y[0];
      if (current) setYearId(String(current.id));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!yearId || !typeId || !studentId || !dueDate || !amount) {
      setError("Academic year, fee type, student, due date and amount are required.");
      return;
    }
    try {
      setError("");
      const payload = {
        academic_year: Number(yearId),
        fees_type: Number(typeId),
        student: Number(studentId),
        due_date: dueDate,
        amount,
        discount_amount: discount || "0",
      };
      if (editingId) {
        await feesApi.updateAssignment(editingId, payload);
      } else {
        await feesApi.createAssignment(payload);
      }
      setEditingId(null);
      setTypeId("");
      setStudentId("");
      setDueDate("");
      setAmount("");
      setDiscount("0");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20"><div className="container-fluid"><h1 style={{ margin: 0, fontSize: 24 }}>Fees Master</h1></div></section>
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Fees Master" : "Add Fees Master"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 160px 120px 120px auto", gap: 8 }}>
            <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={field()}>
              <option value="">Academic year</option>
              {years.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} style={field()}>
              <option value="">Fees type</option>
              {types.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={field()}>
              <option value="">Student</option>
              {students.map((it) => <option key={it.id} value={it.id}>{(it.first_name || "") + " " + (it.last_name || "")} ({it.admission_no || "-"})</option>)}
            </select>
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" style={field()} />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Amount" style={field()} />
            <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" min="0" step="0.01" placeholder="Discount" style={field()} />
            <button type="submit" style={btn()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Student</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Due Date</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Amount</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const type = types.find((it) => it.id === row.fees_type);
                const student = students.find((it) => it.id === row.student);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{type?.name || row.fees_type}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student ? `${student.first_name || ""} ${student.last_name || ""}` : row.student}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.due_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.amount}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" style={btn("#0ea5e9")} onClick={() => { setEditingId(row.id); setYearId(String(row.academic_year)); setTypeId(String(row.fees_type)); setStudentId(String(row.student)); setDueDate(row.due_date); setAmount(row.amount); setDiscount(row.discount_amount || "0"); }}>Edit</button>
                        <button type="button" style={btn("#dc2626")} onClick={() => void feesApi.deleteAssignment(row.id).then(load).catch((e) => setError(e instanceof Error ? e.message : "Delete failed."))}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}
