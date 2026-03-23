"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { clearAuthTokens, getAccessToken, getRefreshToken } from "@/lib/auth";

type Permission = {
  id: number;
  code: string;
  name: string;
  module: string;
};

type PermissionApiResult = {
  results?: Permission[];
};

type RoleItem = {
  id: number;
  name: string;
  is_system: boolean;
  permission_ids: number[];
  created_at: string;
};

type RoleApiResult = {
  results?: RoleItem[];
};

export function RoleManagementPanel() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(new Set());

  const loadRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/access-control/roles/`, {
        cache: "no-store",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      const data = (await response.json()) as RoleApiResult | RoleItem[];
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        setRoles(data.results || []);
      }
    } catch (e) {
      setError("Unable to load roles yet. Authenticate API and run migrations to view data.");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/access-control/permissions/`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = (await response.json()) as PermissionApiResult | Permission[];
      setAllPermissions(Array.isArray(data) ? data : data.results || []);
    } catch {
      // permissions panel silently skips if not yet seeded
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const createOrUpdateRole = async (event: FormEvent) => {
    event.preventDefault();
    if (!roleName.trim()) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Login is required before creating or updating roles.");
      return;
    }

    const isUpdate = editingRoleId !== null;

    try {
      setError("");
      const response = await fetch(
        `${API_BASE_URL}/api/v1/access-control/roles/${isUpdate ? `${editingRoleId}/` : ""}`,
        {
          method: isUpdate ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: roleName.trim(), permission_ids: Array.from(selectedPermIds) }),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      setRoleName("");
      setEditingRoleId(null);
      setSelectedPermIds(new Set());
      await loadRoles();
    } catch (e) {
      setError("Unable to save role. Ensure your user has role.manage permission.");
    }
  };

  const startEdit = (role: RoleItem) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setSelectedPermIds(new Set(role.permission_ids || []));
  };

  const cancelEdit = () => {
    setEditingRoleId(null);
    setRoleName("");
    setSelectedPermIds(new Set());
  };

  const togglePerm = (id: number) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const logout = async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    try {
      if (accessToken && refreshToken) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } finally {
      clearAuthTokens();
      setRoles([]);
      setError("Logged out. Open /login to sign in again.");
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Role Management</h1>
          <p style={{ marginTop: 8, color: "var(--text-muted)" }}>
            Manage role catalog and permissions per school tenant.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            border: "1px solid var(--line)",
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: 16,
          marginBottom: 14,
        }}
      >
        <form onSubmit={createOrUpdateRole} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Name row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="Enter role name"
              style={{
                height: 38,
                minWidth: 260,
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "0 10px",
              }}
            />
            <button
              type="submit"
              style={{
                border: "1px solid var(--primary)",
                background: "var(--primary)",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              {editingRoleId ? "Update Role" : "Create Role"}
            </button>
            {editingRoleId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Permissions picker — grouped by module */}
          {allPermissions.length > 0 && (() => {
            const byModule: Record<string, Permission[]> = {};
            for (const p of allPermissions) {
              (byModule[p.module] = byModule[p.module] || []).push(p);
            }
            return (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" }}>
                  Assign Permissions
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {Object.entries(byModule).map(([mod, perms]) => (
                    <div key={mod} style={{ background: "var(--surface-muted)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: 8 }}>
                        {mod}
                      </div>
                      {perms.map((perm) => (
                        <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginBottom: 4 }}>
                          <input
                            type="checkbox"
                            checked={selectedPermIds.has(perm.id)}
                            onChange={() => togglePerm(perm.id)}
                            style={{ accentColor: "var(--primary)", width: 14, height: 14 }}
                          />
                          {perm.name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </form>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>Roles</div>
        {loading && <div style={{ padding: 14, color: "var(--text-muted)" }}>Loading roles...</div>}
        {!loading && error && <div style={{ padding: 14, color: "var(--warning)" }}>{error}</div>}
        {!loading && !error && roles.length === 0 && (
          <div style={{ padding: 14, color: "var(--text-muted)" }}>No roles found yet.</div>
        )}
        {!loading && roles.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Name</th>
                <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Type</th>
                <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Permissions</th>
                <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Created</th>
                <th style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>{role.name}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                    {role.is_system ? "System" : "Custom"}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid var(--line)", color: "var(--text-muted)", fontSize: 13 }}>
                    {(role.permission_ids || []).length} permission{(role.permission_ids || []).length !== 1 ? "s" : ""}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                    {new Date(role.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      style={{
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        color: "var(--text)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
