"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

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

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<void>(path, { method: "DELETE", headers: { "Content-Type": "application/json" } });
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function buttonStyle(color = "var(--primary)") {
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

function breadcrumb(title: string) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span>
            <span>/</span>
            <span>Human Resource</span>
            <span>/</span>
            <span>{title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type Department = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
};

type Designation = {
  id: number;
  department: number;
  name: string;
  is_active: boolean;
};

type Staff = {
  id: number;
  staff_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: number | null;
  designation: number | null;
  join_date: string;
  basic_salary: string;
  status: "active" | "inactive" | "terminated";
};

type LeaveType = {
  id: number;
  name: string;
  max_days_per_year: number;
  is_paid: boolean;
  is_active: boolean;
};

type LeaveRequest = {
  id: number;
  staff: number;
  leave_type: number;
  from_date: string;
  to_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

type PayrollRecord = {
  id: number;
  staff: number;
  payroll_month: number;
  payroll_year: number;
  basic_salary: string;
  allowance: string;
  deduction: string;
  net_salary: string;
  status: "draft" | "processed" | "paid";
  paid_at: string | null;
};

type PayrollSummary = {
  total_records: number;
  total_basic_salary: string;
  total_allowance: string;
  total_deduction: string;
  total_net_salary: string;
};

export function HrDepartmentsPanel() {
  const [rows, setRows] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<ApiList<Department>>("/api/v1/hr/departments/");
      setRows(listData(data));
    } catch {
      setError("Unable to load departments.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    try {
      setError("");
      const payload = { name: name.trim(), description: description.trim(), is_active: isActive };
      if (editingId) {
        await apiPatch(`/api/v1/hr/departments/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/hr/departments/", payload);
      }
      setEditingId(null);
      setName("");
      setDescription("");
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save department.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Departments")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Department" : "Add Department"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Department name *" style={fieldStyle()} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={fieldStyle()} />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Description</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.description || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setName(row.name); setDescription(row.description || ""); setIsActive(row.is_active); }}>Edit</button>
                      <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/hr/departments/${row.id}/`).then(load).catch(() => setError("Unable to delete department."))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}

export function HrDesignationsPanel() {
  const [rows, setRows] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [designationData, departmentData] = await Promise.all([
        apiGet<ApiList<Designation>>("/api/v1/hr/designations/"),
        apiGet<ApiList<Department>>("/api/v1/hr/departments/?is_active=true"),
      ]);
      setRows(listData(designationData));
      setDepartments(listData(departmentData));
    } catch {
      setError("Unable to load designations.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!departmentId || !name.trim()) {
      setError("Department and designation name are required.");
      return;
    }
    try {
      setError("");
      const payload = { department: Number(departmentId), name: name.trim(), is_active: isActive };
      if (editingId) {
        await apiPatch(`/api/v1/hr/designations/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/hr/designations/", payload);
      }
      setEditingId(null);
      setDepartmentId("");
      setName("");
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save designation.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Designations")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Designation" : "Add Designation"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8 }}>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={fieldStyle()}>
              <option value="">Department</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Designation name *" style={fieldStyle()} />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Department</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const department = departments.find((item) => item.id === row.department);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{department?.name || row.department}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setDepartmentId(String(row.department)); setName(row.name); setIsActive(row.is_active); }}>Edit</button>
                        <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/hr/designations/${row.id}/`).then(load).catch(() => setError("Unable to delete designation."))}>Delete</button>
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

export function HrStaffPanel() {
  const [rows, setRows] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [staffNo, setStaffNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [basicSalary, setBasicSalary] = useState("0.00");
  const [status, setStatus] = useState<"active" | "inactive" | "terminated">("active");

  const filteredDesignations = useMemo(() => {
    if (!departmentId) return designations;
    return designations.filter((item) => item.department === Number(departmentId));
  }, [designationId, departmentId, designations]);

  const load = async () => {
    try {
      setError("");
      const [staffData, departmentData, designationData] = await Promise.all([
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/"),
        apiGet<ApiList<Department>>("/api/v1/hr/departments/?is_active=true"),
        apiGet<ApiList<Designation>>("/api/v1/hr/designations/?is_active=true"),
      ]);
      setRows(listData(staffData));
      setDepartments(listData(departmentData));
      setDesignations(listData(designationData));
    } catch {
      setError("Unable to load staff.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!staffNo.trim() || !firstName.trim() || !joinDate) {
      setError("Staff no, first name and join date are required.");
      return;
    }

    try {
      setError("");
      const payload = {
        staff_no: staffNo.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department: departmentId ? Number(departmentId) : null,
        designation: designationId ? Number(designationId) : null,
        join_date: joinDate,
        basic_salary: basicSalary || "0.00",
        status,
      };
      if (editingId) {
        await apiPatch(`/api/v1/hr/staff/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/hr/staff/", payload);
      }
      setEditingId(null);
      setStaffNo("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDepartmentId("");
      setDesignationId("");
      setJoinDate(new Date().toISOString().slice(0, 10));
      setBasicSalary("0.00");
      setStatus("active");
      await load();
    } catch {
      setError("Unable to save staff.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Staff")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Staff" : "Add Staff"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
            <input value={staffNo} onChange={(e) => setStaffNo(e.target.value)} placeholder="Staff no *" style={fieldStyle()} />
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name *" style={fieldStyle()} />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={fieldStyle()} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={fieldStyle()} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={fieldStyle()} />

            <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setDesignationId(""); }} style={fieldStyle()}>
              <option value="">Department</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={designationId} onChange={(e) => setDesignationId(e.target.value)} style={fieldStyle()}>
              <option value="">Designation</option>
              {filteredDesignations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} style={fieldStyle()} />
            <input type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="Basic salary" style={fieldStyle()} />
            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "terminated")} style={fieldStyle()}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>

            <div style={{ gridColumn: "1 / -1" }}><button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button></div>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff No</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Department</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Designation</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Salary</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const department = departments.find((item) => item.id === row.department);
                const designation = designations.find((item) => item.id === row.designation);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.staff_no}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.first_name} {row.last_name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{department?.name || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{designation?.name || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.basic_salary}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setStaffNo(row.staff_no); setFirstName(row.first_name); setLastName(row.last_name || ""); setEmail(row.email || ""); setPhone(row.phone || ""); setDepartmentId(row.department ? String(row.department) : ""); setDesignationId(row.designation ? String(row.designation) : ""); setJoinDate(row.join_date); setBasicSalary(row.basic_salary || "0.00"); setStatus(row.status); }}>Edit</button>
                        <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/hr/staff/${row.id}/`).then(load).catch(() => setError("Unable to delete staff."))}>Delete</button>
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

export function HrLeaveTypesPanel() {
  const [rows, setRows] = useState<LeaveType[]>([]);
  const [name, setName] = useState("");
  const [maxDays, setMaxDays] = useState("0");
  const [isPaid, setIsPaid] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<ApiList<LeaveType>>("/api/v1/hr/leave-types/");
      setRows(listData(data));
    } catch {
      setError("Unable to load leave types.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Leave type name is required.");
      return;
    }
    try {
      setError("");
      const payload = { name: name.trim(), max_days_per_year: Number(maxDays || "0"), is_paid: isPaid, is_active: isActive };
      if (editingId) {
        await apiPatch(`/api/v1/hr/leave-types/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/hr/leave-types/", payload);
      }
      setEditingId(null);
      setName("");
      setMaxDays("0");
      setIsPaid(true);
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save leave type.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Leave Types")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Leave Type" : "Add Leave Type"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 180px auto auto auto", gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Leave type name *" style={fieldStyle()} />
            <input type="number" min="0" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} placeholder="Max days" style={fieldStyle()} />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} /> Paid</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Max Days</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Paid</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.max_days_per_year}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_paid ? "Yes" : "No"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setName(row.name); setMaxDays(String(row.max_days_per_year)); setIsPaid(row.is_paid); setIsActive(row.is_active); }}>Edit</button>
                      <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/hr/leave-types/${row.id}/`).then(load).catch(() => setError("Unable to delete leave type."))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}

export function HrLeaveRequestsPanel() {
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [staffRows, setStaffRows] = useState<Staff[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [error, setError] = useState("");

  const [staffId, setStaffId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected">("");

  const load = async () => {
    try {
      setError("");
      const [leaveData, staffData, typeData] = await Promise.all([
        apiGet<ApiList<LeaveRequest>>(`/api/v1/hr/leave-requests/${statusFilter ? `?status=${statusFilter}` : ""}`),
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/?status=active"),
        apiGet<ApiList<LeaveType>>("/api/v1/hr/leave-types/?is_active=true"),
      ]);
      setRows(listData(leaveData));
      setStaffRows(listData(staffData));
      setLeaveTypes(listData(typeData));
    } catch {
      setError("Unable to load leave requests.");
    }
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!staffId || !leaveTypeId || !fromDate || !toDate) {
      setError("Staff, leave type, from date and to date are required.");
      return;
    }
    try {
      setError("");
      await apiPost("/api/v1/hr/leave-requests/", {
        staff: Number(staffId),
        leave_type: Number(leaveTypeId),
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim(),
      });
      setStaffId("");
      setLeaveTypeId("");
      setFromDate("");
      setToDate("");
      setReason("");
      await load();
    } catch {
      setError("Unable to save leave request.");
    }
  };

  const setStatus = async (id: number, action: "approve" | "reject") => {
    try {
      await apiPost(`/api/v1/hr/leave-requests/${id}/${action}/`, {});
      await load();
    } catch {
      setError(`Unable to ${action} leave request.`);
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Leave Requests")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Apply Leave</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 180px 1fr auto", gap: 8 }}>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={fieldStyle()}>
              <option value="">Staff</option>
              {staffRows.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} ({item.staff_no})</option>)}
            </select>
            <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} style={fieldStyle()}>
              <option value="">Leave type</option>
              {leaveTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={fieldStyle()} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={fieldStyle()} />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" style={fieldStyle()} />
            <button type="submit" style={buttonStyle()}>Save</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Search Criteria</h3>
          <div style={{ display: "grid", gridTemplateColumns: "180px auto", gap: 8 }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | "pending" | "approved" | "rejected")} style={fieldStyle()}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void load()}>Search</button>
          </div>
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Leave Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>From</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>To</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const staff = staffRows.find((item) => item.id === row.staff);
                const leaveType = leaveTypes.find((item) => item.id === row.leave_type);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{staff ? `${staff.first_name} ${staff.last_name}` : row.staff}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{leaveType?.name || row.leave_type}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.from_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.to_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      {row.status === "pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" style={buttonStyle("#059669")} onClick={() => void setStatus(row.id, "approve")}>Approve</button>
                          <button type="button" style={buttonStyle("#dc2626")} onClick={() => void setStatus(row.id, "reject")}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>No action</span>
                      )}
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

export function HrPayrollPanel() {
  const [rows, setRows] = useState<PayrollRecord[]>([]);
  const [staffRows, setStaffRows] = useState<Staff[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [error, setError] = useState("");

  const [staffId, setStaffId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [basicSalary, setBasicSalary] = useState("0.00");
  const [allowance, setAllowance] = useState("0.00");
  const [deduction, setDeduction] = useState("0.00");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "processed" | "paid">("");

  const load = async () => {
    try {
      setError("");
      const [payrollData, staffData, summaryData] = await Promise.all([
        apiGet<ApiList<PayrollRecord>>(`/api/v1/hr/payroll/${statusFilter ? `?status=${statusFilter}` : ""}`),
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/?status=active"),
        apiGet<PayrollSummary>("/api/v1/hr/payroll/summary/"),
      ]);
      setRows(listData(payrollData));
      setStaffRows(listData(staffData));
      setSummary(summaryData);
    } catch {
      setError("Unable to load payroll records.");
    }
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!staffId || !month || !year) {
      setError("Staff, month and year are required.");
      return;
    }
    try {
      setError("");
      await apiPost("/api/v1/hr/payroll/", {
        staff: Number(staffId),
        payroll_month: Number(month),
        payroll_year: Number(year),
        basic_salary: basicSalary || "0.00",
        allowance: allowance || "0.00",
        deduction: deduction || "0.00",
      });
      setStaffId("");
      setBasicSalary("0.00");
      setAllowance("0.00");
      setDeduction("0.00");
      await load();
    } catch {
      setError("Unable to save payroll record.");
    }
  };

  const markPaid = async (id: number) => {
    try {
      await apiPost(`/api/v1/hr/payroll/${id}/mark-paid/`, {});
      await load();
    } catch {
      setError("Unable to mark payroll as paid.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Payroll")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Add Payroll</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr 1fr 1fr auto", gap: 8 }}>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={fieldStyle()}>
              <option value="">Staff</option>
              {staffRows.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} ({item.staff_no})</option>)}
            </select>
            <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Month" style={fieldStyle()} />
            <input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" style={fieldStyle()} />
            <input type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="Basic salary" style={fieldStyle()} />
            <input type="number" min="0" step="0.01" value={allowance} onChange={(e) => setAllowance(e.target.value)} placeholder="Allowance" style={fieldStyle()} />
            <input type="number" min="0" step="0.01" value={deduction} onChange={(e) => setDeduction(e.target.value)} placeholder="Deduction" style={fieldStyle()} />
            <button type="submit" style={buttonStyle()}>Save</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Search Criteria</h3>
          <div style={{ display: "grid", gridTemplateColumns: "180px auto", gap: 8 }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | "draft" | "processed" | "paid")} style={fieldStyle()}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
            </select>
            <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void load()}>Search</button>
          </div>
        </div>

        {summary && (
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Payroll Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
              <div>Total: <strong>{summary.total_records}</strong></div>
              <div>Basic: <strong>{summary.total_basic_salary}</strong></div>
              <div>Allowance: <strong>{summary.total_allowance}</strong></div>
              <div>Deduction: <strong>{summary.total_deduction}</strong></div>
              <div>Net: <strong>{summary.total_net_salary}</strong></div>
            </div>
          </div>
        )}

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Month</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Year</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Basic</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Allowance</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Deduction</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Net</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const staff = staffRows.find((item) => item.id === row.staff);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{staff ? `${staff.first_name} ${staff.last_name}` : row.staff}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.payroll_month}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.payroll_year}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.basic_salary}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.allowance}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.deduction}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.net_salary}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      {row.status !== "paid" ? (
                        <button type="button" style={buttonStyle("#059669")} onClick={() => void markPaid(row.id)}>Mark Paid</button>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>No action</span>
                      )}
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
