"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type Option = { id: number; name: string };
type SectionOption = { id: number; name: string; class_id: number };

type CriteriaResponse = {
  roles: Option[];
  classes: Option[];
  sections: SectionOption[];
};

type DueUserRow = {
  user_id: number;
  username: string;
  name: string;
  role_id: number;
  role_name: string;
  due_fees_login_blocked: boolean;
  admission_no: string;
  roll_no: string;
  class_name: string;
  section_name: string;
  due_amount: string;
};

type UserResponse = {
  role: { id: number; name: string };
  users: DueUserRow[];
};

export function DueFeesLoginPermissionPanel() {
  const [roles, setRoles] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  const [roleId, setRoleId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [name, setName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");

  const [rows, setRows] = useState<DueUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedRole = useMemo(() => roles.find((r) => String(r.id) === roleId) || null, [roles, roleId]);
  const isStudentRole = useMemo(() => {
    if (!selectedRole) return false;
    return selectedRole.name.toLowerCase().includes("student") || selectedRole.id === 2;
  }, [selectedRole]);

  const filteredSections = useMemo(() => {
    if (!classId) return sections;
    return sections.filter((s) => String(s.class_id) === classId);
  }, [sections, classId]);

  const loadCriteria = async () => {
    try {
      const payload = await apiRequestWithRefresh<CriteriaResponse>("/api/v1/access-control/due-fees-login-permission/");
      setRoles(payload.roles || []);
      setClasses(payload.classes || []);
      setSections(payload.sections || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load criteria.");
    }
  };

  useEffect(() => {
    void loadCriteria();
  }, []);

  useEffect(() => {
    setSectionId("");
  }, [classId]);

  const searchUsers = async () => {
    if (!roleId) {
      setError("Select role first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const query = new URLSearchParams();
      query.set("role", roleId);
      if (classId) query.set("class", classId);
      if (sectionId) query.set("section", sectionId);
      if (name.trim()) query.set("name", name.trim());
      if (admissionNo.trim()) query.set("admission_no", admissionNo.trim());

      const payload = await apiRequestWithRefresh<UserResponse>(
        `/api/v1/access-control/due-fees-login-permission/users/?${query.toString()}`,
      );
      setRows(payload.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlocked = async (userId: number, blocked: boolean) => {
    setError("");
    setMessage("");
    try {
      await apiRequestWithRefresh("/api/v1/access-control/due-fees-login-permission/toggle/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: blocked }),
      });
      setRows((prev) => prev.map((row) => (row.user_id === userId ? { ...row, due_fees_login_blocked: blocked } : row)));
      setMessage("Due fees login permission updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update due fees permission.");
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Due Fees Login Permission</h1>
          <p style={{ marginTop: 8, color: "var(--text-muted)" }}>
            Manage login blocking for users with fee dues.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/roles" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Role</Link>
          <Link href="/roles/assign-permission" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Assign Permission</Link>
          <Link href="/roles/login-permission" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Login Permission</Link>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={{ width: "100%", height: 36 }}>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: "100%", height: 36 }} disabled={!isStudentRole}>
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ width: "100%", height: 36 }} disabled={!isStudentRole}>
              <option value="">Select section</option>
              {filteredSections.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student/Parent name" style={{ width: "100%", height: 36, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Admission No</label>
            <input value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} placeholder="Admission no" style={{ width: "100%", height: 36, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button type="button" onClick={searchUsers} style={{ border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", borderRadius: 8, padding: "8px 14px" }}>
            Search
          </button>
        </div>
      </div>

      {error && <div style={{ marginBottom: 8, color: "var(--danger)" }}>{error}</div>}
      {message && <div style={{ marginBottom: 8, color: "var(--primary)" }}>{message}</div>}

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)" }}>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Due Amount</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Role</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Login Blocked</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 10, color: "var(--text-muted)" }}>
                  No users found. Select role and click search.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 10, color: "var(--text-muted)" }}>Loading...</td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.user_id}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                  {row.class_name ? `${row.class_name}${row.section_name ? ` (${row.section_name})` : ""}` : "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.due_amount || "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.role_name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                  <input
                    type="checkbox"
                    checked={row.due_fees_login_blocked}
                    onChange={(event) => void toggleBlocked(row.user_id, event.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
