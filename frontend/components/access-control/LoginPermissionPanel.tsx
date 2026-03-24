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

type LoginUserRow = {
  user_id: number;
  username: string;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  access_status: boolean;
  staff_no: string;
  admission_no: string;
  roll_no: string;
  class_name: string;
  section_name: string;
};

type UserResponse = {
  role: { id: number; name: string };
  users: LoginUserRow[];
};

export function LoginPermissionPanel() {
  const [roles, setRoles] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  const [roleId, setRoleId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<LoginUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordMap, setPasswordMap] = useState<Record<number, string>>({});

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
      const payload = await apiRequestWithRefresh<CriteriaResponse>("/api/v1/access-control/login-access-control/");
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
      if (search.trim()) query.set("search", search.trim());

      const payload = await apiRequestWithRefresh<UserResponse>(
        `/api/v1/access-control/login-access-control/users/?${query.toString()}`,
      );
      setRows(payload.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (userId: number, checked: boolean) => {
    setError("");
    setMessage("");
    try {
      await apiRequestWithRefresh("/api/v1/access-control/login-access-control/toggle/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: checked }),
      });

      setRows((prev) => prev.map((row) => (row.user_id === userId ? { ...row, access_status: checked } : row)));
      setMessage("Login permission updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update permission.");
    }
  };

  const resetPassword = async (userId: number, defaultPassword = false) => {
    setError("");
    setMessage("");
    try {
      const entered = (passwordMap[userId] || "").trim();
      const password = defaultPassword ? "123456" : entered;
      if (!password) {
        setError("Enter password before update.");
        return;
      }

      await apiRequestWithRefresh("/api/v1/access-control/login-access-control/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });

      setMessage(defaultPassword ? "Password reset to 123456." : "Password updated.");
      if (!defaultPassword) {
        setPasswordMap((prev) => ({ ...prev, [userId]: "" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password.");
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Login Permission</h1>
          <p style={{ marginTop: 8, color: "var(--text-muted)" }}>Search users by role and toggle login access.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/roles" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Role</Link>
          <Link href="/roles/assign-permission" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Assign Permission</Link>
          <Link href="/roles/due-fees-login-permission" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Due Fees Login Permission</Link>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
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
            <label style={{ display: "block", marginBottom: 4 }}>Search</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name/Username" style={{ width: "100%", height: 36, boxSizing: "border-box" }} />
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
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)" }}>
              {isStudentRole ? (
                <>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Admission</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Roll</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th>
                </>
              ) : (
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Staff No</th>
              )}
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Username</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Email</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Login Permission</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Password</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 10, color: "var(--text-muted)" }}>
                  No users found. Select role and click search.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} style={{ padding: 10, color: "var(--text-muted)" }}>Loading...</td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.user_id}>
                {isStudentRole ? (
                  <>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.admission_no || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.roll_no || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      {row.class_name ? `${row.class_name}${row.section_name ? ` (${row.section_name})` : ""}` : "-"}
                    </td>
                  </>
                ) : (
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.staff_no || "-"}</td>
                )}
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.username}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.email || "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                  <input
                    type="checkbox"
                    checked={row.access_status}
                    onChange={(event) => void toggle(row.user_id, event.target.checked)}
                  />
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={passwordMap[row.user_id] || ""}
                      onChange={(event) => setPasswordMap((prev) => ({ ...prev, [row.user_id]: event.target.value }))}
                      placeholder="New password"
                      style={{ height: 30, minWidth: 120 }}
                    />
                    <button type="button" onClick={() => void resetPassword(row.user_id, false)} style={{ border: "1px solid var(--line)", background: "var(--surface)", borderRadius: 6, padding: "5px 8px" }}>
                      Update
                    </button>
                    <button type="button" onClick={() => void resetPassword(row.user_id, true)} style={{ border: "1px solid var(--line)", background: "var(--surface)", borderRadius: 6, padding: "5px 8px" }}>
                      Default
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
