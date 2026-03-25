"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  role: number | null;
  staff_no: string;
  first_name: string;
  last_name: string;
  fathers_name: string;
  mothers_name: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "";
  marital_status: "single" | "married" | "";
  email: string;
  phone: string;
  emergency_mobile: string;
  driving_license: string;
  staff_photo: string;
  current_address: string;
  permanent_address: string;
  qualification: string;
  experience: string;
  epf_no: string;
  bank_account_name: string;
  bank_account_no: string;
  bank_name: string;
  bank_branch: string;
  contract_type: "permanent" | "contract" | "";
  location: string;
  facebook_url: string;
  twitter_url: string;
  linkedin_url: string;
  instagram_url: string;
  resume: string;
  joining_letter: string;
  other_document: string;
  casual_leave: number;
  medical_leave: number;
  maternity_leave: number;
  show_public: boolean;
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

type Role = {
  id: number;
  name: string;
};

type LeaveDefine = {
  id: number;
  role: number | null;
  role_name: string;
  staff: number | null;
  staff_name: string;
  leave_type: number;
  leave_type_name: string;
  days: number;
};

type LeaveRequest = {
  id: number;
  staff: number;
  leave_type: number;
  from_date: string;
  to_date: string;
  created_at: string;
  reason: string;
  attachment: string;
  approval_note: string;
  status: "pending" | "approved" | "rejected";
};

type StaffAttendance = {
  id: number;
  staff: number;
  staff_name: string;
  attendance_date: string;
  attendance_type: "P" | "A" | "L" | "F" | "H";
  note: string;
};

type AttendanceReport = {
  total: number;
  by_type: Record<string, number>;
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "payroll" | "bank" | "social" | "document">("basic");

  const [staffNo, setStaffNo] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [mothersName, setMothersName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [phone, setPhone] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<"" | "single" | "married">("");
  const [emergencyMobile, setEmergencyMobile] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [staffPhoto, setStaffPhoto] = useState("");
  const [showPublic, setShowPublic] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");

  const [epfNo, setEpfNo] = useState("");
  const [basicSalary, setBasicSalary] = useState("0.00");
  const [contractType, setContractType] = useState<"" | "permanent" | "contract">("");
  const [location, setLocation] = useState("");

  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [resume, setResume] = useState("");
  const [joiningLetter, setJoiningLetter] = useState("");
  const [otherDocument, setOtherDocument] = useState("");

  const staffPhotoRef = useRef<HTMLInputElement | null>(null);
  const resumeRef = useRef<HTMLInputElement | null>(null);
  const joiningLetterRef = useRef<HTMLInputElement | null>(null);
  const otherDocRef = useRef<HTMLInputElement | null>(null);

  const filteredDesignations = useMemo(() => {
    if (!departmentId) return designations;
    return designations.filter((item) => item.department === Number(departmentId));
  }, [departmentId, designations]);

  const resetForm = () => {
    setActiveTab("basic");
    setStaffNo("");
    setRoleId("");
    setDepartmentId("");
    setDesignationId("");
    setFirstName("");
    setLastName("");
    setFathersName("");
    setMothersName("");
    setEmail("");
    setGender("");
    setDateOfBirth("");
    setJoinDate(new Date().toISOString().slice(0, 10));
    setPhone("");
    setMaritalStatus("");
    setEmergencyMobile("");
    setDrivingLicense("");
    setStaffPhoto("");
    setShowPublic(false);
    setCurrentAddress("");
    setPermanentAddress("");
    setQualification("");
    setExperience("");
    setEpfNo("");
    setBasicSalary("0.00");
    setContractType("");
    setLocation("");
    setBankAccountName("");
    setBankAccountNo("");
    setBankName("");
    setBankBranch("");
    setFacebookUrl("");
    setTwitterUrl("");
    setLinkedinUrl("");
    setInstagramUrl("");
    setResume("");
    setJoiningLetter("");
    setOtherDocument("");
  };

  const load = async () => {
    try {
      setError("");
      const [roleData, departmentData, designationData] = await Promise.all([
        apiGet<ApiList<Role>>("/api/v1/access-control/roles/"),
        apiGet<ApiList<Department>>("/api/v1/hr/departments/?is_active=true"),
        apiGet<ApiList<Designation>>("/api/v1/hr/designations/?is_active=true"),
      ]);
      setRoles(listData(roleData));
      setDepartments(listData(departmentData));
      setDesignations(listData(designationData));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load staff.";
      setError("Unable to load staff.");
      if (message && message !== "Unable to load staff.") {
        setError(message);
      }
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!staffNo.trim() || !firstName.trim() || !email.trim() || !joinDate) {
      setError("Staff no, first name, email and date of joining are required.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      const payload = {
        staff_no: staffNo.trim(),
        role: roleId ? Number(roleId) : null,
        department: departmentId ? Number(departmentId) : null,
        designation: designationId ? Number(designationId) : null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        fathers_name: fathersName.trim(),
        mothers_name: mothersName.trim(),
        email: email.trim(),
        gender,
        date_of_birth: dateOfBirth || null,
        join_date: joinDate,
        phone: phone.trim(),
        marital_status: maritalStatus,
        emergency_mobile: emergencyMobile.trim(),
        driving_license: drivingLicense.trim(),
        staff_photo: staffPhoto.trim(),
        show_public: showPublic,
        current_address: currentAddress.trim(),
        permanent_address: permanentAddress.trim(),
        qualification: qualification.trim(),
        experience: experience.trim(),
        epf_no: epfNo.trim(),
        basic_salary: basicSalary || "0.00",
        contract_type: contractType,
        location: location.trim(),
        bank_account_name: bankAccountName.trim(),
        bank_account_no: bankAccountNo.trim(),
        bank_name: bankName.trim(),
        bank_branch: bankBranch.trim(),
        facebook_url: facebookUrl.trim(),
        twitter_url: twitterUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        instagram_url: instagramUrl.trim(),
        resume: resume.trim(),
        joining_letter: joiningLetter.trim(),
        other_document: otherDocument.trim(),
        status: "active",
      };

      await apiPost("/api/v1/hr/staff/", payload);

      resetForm();
      setSuccess("Staff has been added successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save staff.");
    }
  };

  const tabs: Array<{ key: "basic" | "payroll" | "bank" | "social" | "document"; label: string }> = [
    { key: "basic", label: "Basic Info" },
    { key: "payroll", label: "Payroll Details" },
    { key: "bank", label: "Bank Info Details" },
    { key: "social", label: "Social Links Details" },
    { key: "document", label: "Document Info" },
  ];

  const sectionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 } as const;

  return (
    <div className="legacy-panel">
      {breadcrumb("Add New Staff")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Staff Information</h3>
            <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
              <button type="button" style={buttonStyle("#7c3aed")}>Import Staff</button>
              <button type="submit" form="staff-form" style={buttonStyle()}>Save Staff</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: activeTab === tab.key ? "#e6ebff" : "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 12,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form id="staff-form" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            {activeTab === "basic" && (
              <div style={sectionGrid}>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Staff No *</span><input value={staffNo} onChange={(e) => setStaffNo(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Role *</span><select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={fieldStyle()}><option value="">Role *</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Department</span><select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setDesignationId(""); }} style={fieldStyle()}><option value="">Department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Designation</span><select value={designationId} onChange={(e) => setDesignationId(e.target.value)} style={fieldStyle()}><option value="">Designation</option>{filteredDesignations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>

                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>First Name *</span><input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Last Name</span><input value={lastName} onChange={(e) => setLastName(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Father Name</span><input value={fathersName} onChange={(e) => setFathersName(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Mother Name</span><input value={mothersName} onChange={(e) => setMothersName(e.target.value)} style={fieldStyle()} /></label>

                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Email *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Gender</span><select value={gender} onChange={(e) => setGender(e.target.value as "" | "male" | "female" | "other")} style={fieldStyle()}><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Date Of Birth</span><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Date Of Joining *</span><input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} style={fieldStyle()} /></label>

                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Mobile</span><input value={phone} onChange={(e) => setPhone(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Marital Status</span><select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value as "" | "single" | "married")} style={fieldStyle()}><option value="">Marital Status</option><option value="single">Single</option><option value="married">Married</option></select></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Emergency Mobile</span><input value={emergencyMobile} onChange={(e) => setEmergencyMobile(e.target.value)} style={fieldStyle()} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Driving License</span><input value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} style={fieldStyle()} /></label>

                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Staff Photo</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 86px", gap: 6 }}>
                    <input readOnly value={staffPhoto || "Staff Photo"} style={fieldStyle()} />
                    <button type="button" style={buttonStyle("#7c3aed")} onClick={() => staffPhotoRef.current?.click()}>Browse</button>
                    <input ref={staffPhotoRef} type="file" style={{ display: "none" }} onChange={(e) => setStaffPhoto(e.target.files?.[0]?.name || "")} />
                  </div>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Show As Expert Staff</span>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", height: 36 }}>
                    <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={showPublic} onChange={() => setShowPublic(true)} /> Yes</label>
                    <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={!showPublic} onChange={() => setShowPublic(false)} /> No</label>
                  </div>
                </div>
                <div />
                <div />

                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Current Address</span><textarea value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} style={{ width: "100%", minHeight: 84, border: "1px solid var(--line)", borderRadius: 8, padding: 10 }} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Permanent Address</span><textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} style={{ width: "100%", minHeight: 84, border: "1px solid var(--line)", borderRadius: 8, padding: 10 }} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Qualifications</span><textarea value={qualification} onChange={(e) => setQualification(e.target.value)} style={{ width: "100%", minHeight: 84, border: "1px solid var(--line)", borderRadius: 8, padding: 10 }} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Experience</span><textarea value={experience} onChange={(e) => setExperience(e.target.value)} style={{ width: "100%", minHeight: 84, border: "1px solid var(--line)", borderRadius: 8, padding: 10 }} /></label>
              </div>
            )}

            {activeTab === "payroll" && (
              <div style={sectionGrid}>
                <input value={epfNo} onChange={(e) => setEpfNo(e.target.value)} placeholder="EPF No" style={fieldStyle()} />
                <input type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="Basic Salary" style={fieldStyle()} />
                <select value={contractType} onChange={(e) => setContractType(e.target.value as "" | "permanent" | "contract")} style={fieldStyle()}><option value="">Contract Type</option><option value="permanent">Permanent</option><option value="contract">Contract</option></select>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={fieldStyle()} />
              </div>
            )}

            {activeTab === "bank" && (
              <div style={sectionGrid}>
                <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Bank Account Name" style={fieldStyle()} />
                <input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="Account No" style={fieldStyle()} />
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" style={fieldStyle()} />
                <input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="Branch Name" style={fieldStyle()} />
              </div>
            )}

            {activeTab === "social" && (
              <div style={sectionGrid}>
                <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="Facebook URL" style={fieldStyle()} />
                <input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="Twitter URL" style={fieldStyle()} />
                <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" style={fieldStyle()} />
                <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="Instagram URL" style={fieldStyle()} />
              </div>
            )}

            {activeTab === "document" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Resume</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 86px", gap: 6 }}>
                    <input readOnly value={resume || "Resume"} style={fieldStyle()} />
                    <button type="button" style={buttonStyle("#7c3aed")} onClick={() => resumeRef.current?.click()}>Browse</button>
                    <input ref={resumeRef} type="file" style={{ display: "none" }} onChange={(e) => setResume(e.target.files?.[0]?.name || "")} />
                  </div>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Joining Letter</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 86px", gap: 6 }}>
                    <input readOnly value={joiningLetter || "Joining Letter"} style={fieldStyle()} />
                    <button type="button" style={buttonStyle("#7c3aed")} onClick={() => joiningLetterRef.current?.click()}>Browse</button>
                    <input ref={joiningLetterRef} type="file" style={{ display: "none" }} onChange={(e) => setJoiningLetter(e.target.files?.[0]?.name || "")} />
                  </div>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Other Documents</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 86px", gap: 6 }}>
                    <input readOnly value={otherDocument || "Other Document"} style={fieldStyle()} />
                    <button type="button" style={buttonStyle("#7c3aed")} onClick={() => otherDocRef.current?.click()}>Browse</button>
                    <input ref={otherDocRef} type="file" style={{ display: "none" }} onChange={(e) => setOtherDocument(e.target.files?.[0]?.name || "")} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "none" }}>
              <button type="submit">Save</button>
            </div>
          </form>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" style={buttonStyle("#6b7280")} onClick={resetForm}>Reset Form</button>
          </div>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", marginTop: 8 }}>{success}</p>}
        </div>
      </div></section>
    </div>
  );
}

export function HrStaffDirectoryPanel() {
  const [rows, setRows] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setError("");
      const [roleData, departmentData, designationData, staffData] = await Promise.all([
        apiGet<ApiList<Role>>("/api/v1/access-control/roles/"),
        apiGet<ApiList<Department>>("/api/v1/hr/departments/"),
        apiGet<ApiList<Designation>>("/api/v1/hr/designations/"),
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/"),
      ]);
      setRoles(listData(roleData));
      setDepartments(listData(departmentData));
      setDesignations(listData(designationData));
      setRows(listData(staffData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load staff directory.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="legacy-panel">
      {breadcrumb("Staff Directory")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={boxStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Staff List</h3>
            <button type="button" style={buttonStyle("#334155")} onClick={() => void load()}>Refresh</button>
          </div>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", marginTop: 8 }}>{success}</p>}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff No</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Role</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Department</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Designation</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Phone</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 10, color: "var(--text-muted)" }}>No staff found.</td>
                </tr>
              ) : rows.map((row) => {
                const roleName = roles.find((role) => role.id === row.role)?.name || "-";
                const departmentName = departments.find((department) => department.id === row.department)?.name || "-";
                const designationName = designations.find((designation) => designation.id === row.designation)?.name || "-";
                const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.staff_no || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{fullName || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{roleName}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{departmentName}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{designationName}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.phone || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <button
                        type="button"
                        style={buttonStyle("#dc2626")}
                        onClick={() => {
                          if (!window.confirm("Delete this staff member?")) return;
                          void apiDelete(`/api/v1/hr/staff/${row.id}/`).then(() => {
                            setSuccess("Staff has been deleted successfully.");
                            return load();
                          }).catch((err) => {
                            setError(err instanceof Error ? err.message : "Unable to delete staff.");
                          });
                        }}
                      >
                        Delete
                      </button>
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

export function HrLeaveDefinePanel() {
  const [rows, setRows] = useState<LeaveDefine[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [staffRows, setStaffRows] = useState<Staff[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [roleId, setRoleId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [days, setDays] = useState("0");

  const load = async () => {
    try {
      setError("");
      const [defineData, roleData, staffData, leaveTypeData] = await Promise.all([
        apiGet<ApiList<LeaveDefine>>("/api/v1/hr/leave-defines/"),
        apiGet<ApiList<Role>>("/api/v1/access-control/roles/"),
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/"),
        apiGet<ApiList<LeaveType>>("/api/v1/hr/leave-types/?is_active=true"),
      ]);
      setRows(listData(defineData));
      setRoles(listData(roleData));
      setStaffRows(listData(staffData));
      setLeaveTypes(listData(leaveTypeData));
    } catch {
      setError("Unable to load leave define data.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if ((!roleId && !staffId) || !leaveTypeId) {
      setError("Select role or staff, and leave type.");
      return;
    }
    if (roleId && staffId) {
      setError("Select only role or staff.");
      return;
    }

    try {
      setError("");
      const payload = {
        role: roleId ? Number(roleId) : null,
        staff: staffId ? Number(staffId) : null,
        leave_type: Number(leaveTypeId),
        days: Number(days || "0"),
      };
      if (editingId) {
        await apiPatch(`/api/v1/hr/leave-defines/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/hr/leave-defines/", payload);
      }
      setEditingId(null);
      setRoleId("");
      setStaffId("");
      setLeaveTypeId("");
      setDays("0");
      await load();
    } catch {
      setError("Unable to save leave define.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Leave Define")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Leave Define" : "Add Leave Define"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 160px auto", gap: 8 }}>
            <select value={roleId} onChange={(e) => { setRoleId(e.target.value); if (e.target.value) setStaffId(""); }} style={fieldStyle()}>
              <option value="">Role (optional)</option>
              {roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={staffId} onChange={(e) => { setStaffId(e.target.value); if (e.target.value) setRoleId(""); }} style={fieldStyle()}>
              <option value="">Staff (optional)</option>
              {staffRows.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} ({item.staff_no})</option>)}
            </select>
            <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} style={fieldStyle()}>
              <option value="">Leave Type</option>
              {leaveTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input type="number" min="0" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" style={fieldStyle()} />
            <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Scope</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Leave Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Days</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.role_name || row.staff_name || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.leave_type_name || row.leave_type}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.days}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setRoleId(row.role ? String(row.role) : ""); setStaffId(row.staff ? String(row.staff) : ""); setLeaveTypeId(String(row.leave_type)); setDays(String(row.days)); }}>Edit</button>
                      <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/hr/leave-defines/${row.id}/`).then(load).catch(() => setError("Unable to delete leave define."))}>Delete</button>
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

export function HrStaffAttendancePanel() {
  const [staffRows, setStaffRows] = useState<Staff[]>([]);
  const [rows, setRows] = useState<StaffAttendance[]>([]);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [error, setError] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  const [statusByStaff, setStatusByStaff] = useState<Record<number, "P" | "A" | "L" | "F" | "H">>({});
  const [noteByStaff, setNoteByStaff] = useState<Record<number, string>>({});

  const statusLabel: Record<string, string> = {
    P: "Present",
    A: "Absent",
    L: "Leave",
    F: "Half Day",
    H: "Holiday",
  };

  const load = async () => {
    try {
      setError("");
      const [staffData, attendanceData, reportData] = await Promise.all([
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/?status=active"),
        apiGet<ApiList<StaffAttendance>>(`/api/v1/hr/staff-attendance/?attendance_date=${attendanceDate}`),
        apiGet<AttendanceReport>(`/api/v1/hr/staff-attendance/report/?attendance_date=${attendanceDate}`),
      ]);
      const staffList = listData(staffData);
      const attendanceList = listData(attendanceData);

      const statusMap: Record<number, "P" | "A" | "L" | "F" | "H"> = {};
      const noteMap: Record<number, string> = {};
      attendanceList.forEach((item) => {
        statusMap[item.staff] = item.attendance_type;
        noteMap[item.staff] = item.note || "";
      });

      setStaffRows(staffList);
      setRows(attendanceList);
      setReport(reportData);
      setStatusByStaff(statusMap);
      setNoteByStaff(noteMap);
    } catch {
      setError("Unable to load staff attendance.");
    }
  };

  useEffect(() => {
    void load();
  }, [attendanceDate]);

  const saveAttendance = async () => {
    try {
      setError("");
      const payload = {
        rows: staffRows.map((staff) => ({
          staff: staff.id,
          attendance_date: attendanceDate,
          attendance_type: statusByStaff[staff.id] || "P",
          note: noteByStaff[staff.id] || "",
        })),
      };
      await apiPost("/api/v1/hr/staff-attendance/bulk-store/", payload);
      await load();
    } catch {
      setError("Unable to save staff attendance.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Staff Attendance")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Attendance Date</h3>
          <div style={{ display: "grid", gridTemplateColumns: "220px auto auto", gap: 8 }}>
            <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={fieldStyle()} />
            <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void load()}>Load</button>
            <button type="button" style={buttonStyle()} onClick={() => void saveAttendance()}>Save Attendance</button>
          </div>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        {report && (
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Attendance Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
              <div>Total: <strong>{report.total}</strong></div>
              <div>Present: <strong>{report.by_type?.P || 0}</strong></div>
              <div>Absent: <strong>{report.by_type?.A || 0}</strong></div>
              <div>Leave: <strong>{report.by_type?.L || 0}</strong></div>
              <div>Half Day: <strong>{report.by_type?.F || 0}</strong></div>
              <div>Holiday: <strong>{report.by_type?.H || 0}</strong></div>
            </div>
          </div>
        )}

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Note</th></tr></thead>
            <tbody>
              {staffRows.map((staff) => (
                <tr key={staff.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{staff.first_name} {staff.last_name} ({staff.staff_no})</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <select
                      value={statusByStaff[staff.id] || "P"}
                      onChange={(e) => setStatusByStaff((prev) => ({ ...prev, [staff.id]: e.target.value as "P" | "A" | "L" | "F" | "H" }))}
                      style={fieldStyle()}
                    >
                      {Object.entries(statusLabel).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <input
                      value={noteByStaff[staff.id] || ""}
                      onChange={(e) => setNoteByStaff((prev) => ({ ...prev, [staff.id]: e.target.value }))}
                      placeholder="Optional note"
                      style={fieldStyle()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="white-box" style={boxStyle()}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Saved Entries</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Date</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Note</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.staff_name || row.staff}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.attendance_date}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{statusLabel[row.attendance_type] || row.attendance_type}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.note || "-"}</td>
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
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionByRow, setActionByRow] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");

  const [applyDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState("");

  const load = async () => {
    try {
      setError("");
      const [leaveData, typeData] = await Promise.all([
        apiGet<ApiList<LeaveRequest>>("/api/v1/hr/leave-requests/"),
        apiGet<ApiList<LeaveType>>("/api/v1/hr/leave-types/?is_active=true"),
      ]);
      setRows(listData(leaveData));
      setLeaveTypes(listData(typeData));
    } catch {
      setError("Unable to load leave requests.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const leaveType = leaveTypes.find((item) => item.id === row.leave_type);
      return (
        (leaveType?.name || "").toLowerCase().includes(term)
        || row.from_date.includes(term)
        || row.to_date.includes(term)
        || row.status.toLowerCase().includes(term)
      );
    });
  }, [rows, leaveTypes, search]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!leaveTypeId || !fromDate || !toDate) {
      setError("Leave type, from date and to date are required.");
      return;
    }
    try {
      setError("");
      const payload = {
        leave_type: Number(leaveTypeId),
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim(),
        attachment: attachment.trim(),
      };
      if (editingId) {
        await apiPatch(`/api/v1/hr/leave-requests/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/hr/leave-requests/", payload);
      }
      setEditingId(null);
      setLeaveTypeId("");
      setFromDate("");
      setToDate("");
      setReason("");
      setAttachment("");
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save leave request.");
    }
  };

  const deletePending = async (id: number) => {
    try {
      setError("");
      await apiDelete(`/api/v1/hr/leave-requests/${id}/`);
      await load();
    } catch {
      setError("Unable to delete leave request.");
    }
  };

  const viewLeave = (row: LeaveRequest) => {
    const leaveType = leaveTypes.find((item) => item.id === row.leave_type);
    const message = [
      `Leave Type: ${leaveType?.name || row.leave_type}`,
      `From: ${row.from_date}`,
      `To: ${row.to_date}`,
      `Reason: ${row.reason || "-"}`,
      `Attachment: ${row.attachment || "-"}`,
      `Status: ${row.status}`,
      `Approval Note: ${row.approval_note || "-"}`,
    ].join("\n");
    window.alert(message);
  };

  const handleRowAction = async (row: LeaveRequest, action: string) => {
    setActionByRow((prev) => ({ ...prev, [row.id]: "" }));
    if (action === "view") {
      viewLeave(row);
      return;
    }
    if (action === "edit" && row.status === "pending") {
      startEdit(row);
      return;
    }
    if (action === "delete" && row.status === "pending") {
      await deletePending(row.id);
    }
  };

  const statusText = (status: LeaveRequest["status"]) => {
    if (status === "rejected") return "Cancelled";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusColor = (status: LeaveRequest["status"]) => {
    if (status === "approved") return "#059669";
    if (status === "rejected") return "#dc2626";
    return "#d97706";
  };

  const startEdit = (row: LeaveRequest) => {
    setEditingId(row.id);
    setLeaveTypeId(String(row.leave_type));
    setFromDate(row.from_date);
    setToDate(row.to_date);
    setReason(row.reason || "");
    setAttachment(row.attachment || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setLeaveTypeId("");
    setFromDate("");
    setToDate("");
    setReason("");
    setAttachment("");
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Apply Leave")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, alignItems: "start" }}>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Apply Leave" : "Add Apply Leave"}</h3>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Apply Date *</span>
              <input type="date" value={applyDate} readOnly style={{ ...fieldStyle(), background: "#f7f7f7" }} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Leave Type *</span>
              <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} style={fieldStyle()}>
                <option value="">Leave type</option>
                {leaveTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Leave From *</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={fieldStyle()} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Leave To *</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={fieldStyle()} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Reason</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" style={{ width: "100%", minHeight: 90, border: "1px solid var(--line)", borderRadius: 8, padding: 10 }} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>File</span>
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0]?.name || "")}
                style={{ ...fieldStyle(), paddingTop: 7 }}
              />
            </label>
            {attachment && <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Selected: {attachment}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save Apply Leave"}</button>
              {editingId && <button type="button" style={buttonStyle("#6b7280")} onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Leave List</h3>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" style={{ ...fieldStyle(), width: 180 }} />
                <button type="button" style={buttonStyle("#7c3aed")}>Copy</button>
                <button type="button" style={buttonStyle("#7c3aed")}>Excel</button>
                <button type="button" style={buttonStyle("#7c3aed")}>CSV</button>
                <button type="button" style={buttonStyle("#7c3aed")}>PDF</button>
                <button type="button" style={buttonStyle("#7c3aed")}>Print</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>From</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>To</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Apply Date</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => {
                const leaveType = leaveTypes.find((item) => item.id === row.leave_type);
                return (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{leaveType?.name || row.leave_type}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.from_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.to_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, color: "#fff", background: statusColor(row.status), fontSize: 12 }}>
                        {statusText(row.status)}
                      </span>
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <select
                        value={actionByRow[row.id] || ""}
                        onChange={(e) => {
                          const action = e.target.value;
                          setActionByRow((prev) => ({ ...prev, [row.id]: action }));
                          void handleRowAction(row, action);
                        }}
                        style={fieldStyle()}
                      >
                        <option value="">Action</option>
                        <option value="view">View</option>
                        {row.status === "pending" && <option value="edit">Edit</option>}
                        {row.status === "pending" && <option value="delete">Delete</option>}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
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
