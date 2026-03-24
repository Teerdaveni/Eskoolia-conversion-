"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type RoleItem = {
  id: number;
  name: string;
  is_system: boolean;
};

type PermissionNode = {
  id: number;
  code: string;
  name: string;
  selected: boolean;
};

type ModuleNode = {
  module: string;
  permissions: PermissionNode[];
};

type PermissionTreeResponse = {
  role: { id: number; name: string } | null;
  modules: ModuleNode[];
};

type ApiList<T> = T[] | { results?: T[] };

function listData<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results || [];
}

export function AssignPermissionPanel() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [modules, setModules] = useState<ModuleNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeRole = useMemo(() => roles.find((r) => r.id === activeRoleId) || null, [roles, activeRoleId]);

  const loadRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await apiRequestWithRefresh<ApiList<RoleItem>>("/api/v1/access-control/roles/");
      const rows = listData(payload);
      setRoles(rows);
      if (!activeRoleId && rows.length > 0) {
        setActiveRoleId(rows[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  const loadTree = async (roleId: number) => {
    setError("");
    setMessage("");
    try {
      const payload = await apiRequestWithRefresh<PermissionTreeResponse>(
        `/api/v1/access-control/roles/permission-tree/?role=${roleId}`,
      );
      setModules(payload.modules || []);
      const next = new Set<number>();
      for (const moduleRow of payload.modules || []) {
        for (const permission of moduleRow.permissions || []) {
          if (permission.selected) {
            next.add(permission.id);
          }
        }
      }
      setSelectedIds(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load permission tree.");
      setModules([]);
      setSelectedIds(new Set());
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    if (activeRoleId) {
      void loadTree(activeRoleId);
    }
  }, [activeRoleId]);

  const togglePermission = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleModule = (moduleRow: ModuleNode, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const permission of moduleRow.permissions) {
        if (checked) {
          next.add(permission.id);
        } else {
          next.delete(permission.id);
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (!activeRoleId) {
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiRequestWithRefresh(`/api/v1/access-control/roles/${activeRoleId}/assign-permissions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: Array.from(selectedIds) }),
      });
      setMessage("Permissions updated successfully.");
      await loadTree(activeRoleId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Assign Permission</h1>
          <p style={{ marginTop: 8, color: "var(--text-muted)" }}>
            Select a role and assign module permissions.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/roles" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Role</Link>
          <Link href="/roles/login-permission" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Login Permission</Link>
          <Link href="/roles/due-fees-login-permission" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "var(--text)" }}>Due Fees Login Permission</Link>
        </div>
      </div>

      {error && <div style={{ marginBottom: 10, color: "var(--danger)" }}>{error}</div>}
      {message && <div style={{ marginBottom: 10, color: "var(--primary)" }}>{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 12 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>Roles</div>
          {loading && <div style={{ padding: 12, color: "var(--text-muted)" }}>Loading roles...</div>}
          {!loading && roles.length === 0 && <div style={{ padding: 12, color: "var(--text-muted)" }}>No roles found.</div>}
          {!loading && roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRoleId(role.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "none",
                borderBottom: "1px solid var(--line)",
                background: activeRoleId === role.id ? "var(--surface-muted)" : "var(--surface)",
                color: "var(--text)",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              {role.name}
            </button>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>
              {activeRole ? `Permission Matrix: ${activeRole.name}` : "Select a role"}
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!activeRoleId || saving}
              style={{
                border: "1px solid var(--primary)",
                background: "var(--primary)",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: activeRoleId ? "pointer" : "not-allowed",
                opacity: activeRoleId ? 1 : 0.6,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {modules.length === 0 && <div style={{ color: "var(--text-muted)" }}>No permissions found for this role.</div>}

          {modules.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {modules.map((moduleRow) => {
                const total = moduleRow.permissions.length;
                const checkedCount = moduleRow.permissions.filter((p) => selectedIds.has(p.id)).length;
                const allChecked = total > 0 && checkedCount === total;
                return (
                  <div key={moduleRow.module} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{moduleRow.module}</span>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(event) => toggleModule(moduleRow, event.target.checked)}
                      />
                    </label>
                    {moduleRow.permissions.map((permission) => (
                      <label key={permission.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                        />
                        <span style={{ fontSize: 13 }}>{permission.name}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
