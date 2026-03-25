"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
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

function boxStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 14,
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

function spinnerStyle(size = 14) {
  return {
    width: size,
    height: size,
    border: "2px solid rgba(255, 255, 255, 0.35)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  } as const;
}

export function AssignPermissionPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string }>();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [modules, setModules] = useState<ModuleNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeRole = useMemo(() => roles.find((r) => r.id === roleId) || null, [roles, roleId]);

  useEffect(() => {
    const roleFromPath = Number(params?.id || "0") || null;
    const roleFromQuery = Number(searchParams.get("role") || "0") || null;
    const target = roleFromPath || roleFromQuery;
    if (target) setRoleId(target);
  }, [params, searchParams]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    setError("");
    try {
      const payload = await apiRequestWithRefresh<ApiList<RoleItem>>("/api/v1/access-control/roles/");
      const rows = listData(payload);
      setRoles(rows);
      if (!roleId && rows.length > 0) {
        setRoleId(rows[0].id);
      }
    } catch {
      setError("Failed to load roles.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadTree = async (selectedRoleId: number) => {
    setLoadingTree(true);
    setError("");
    try {
      const payload = await apiRequestWithRefresh<PermissionTreeResponse>(
        `/api/v1/access-control/roles/permission-tree/?role=${selectedRoleId}`,
      );
      const rows = payload.modules || [];
      setModules(rows);
      setExpandedModules(
        rows.reduce<Record<string, boolean>>((acc, row, idx) => {
          acc[row.module] = idx === 0;
          return acc;
        }, {}),
      );
      const next = new Set<number>();
      for (const moduleRow of rows) {
        for (const permission of moduleRow.permissions || []) {
          if (permission.selected) next.add(permission.id);
        }
      }
      setSelectedIds(next);
    } catch {
      setError("Failed to load permission list.");
      setModules([]);
      setSelectedIds(new Set());
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    if (roleId) {
      void loadTree(roleId);
    }
  }, [roleId]);

  const togglePermission = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (moduleRow: ModuleNode, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const permission of moduleRow.permissions) {
        if (checked) next.add(permission.id);
        else next.delete(permission.id);
      }
      return next;
    });
  };

  const save = async () => {
    if (!roleId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiRequestWithRefresh(`/api/v1/access-control/roles/${roleId}/assign-permissions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: Array.from(selectedIds) }),
      });
      setMessage("Permissions updated successfully.");
      await loadTree(roleId);
    } catch {
      setError("Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  const onChangeRole = (value: string) => {
    const nextRoleId = Number(value) || null;
    setRoleId(nextRoleId);
    if (nextRoleId) {
      router.replace(`/roles/assign-permission/${nextRoleId}`);
    }
  };

  const toggleModuleExpanded = (moduleKey: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  const prettyModuleName = (value: string) => {
    return value
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <section className="admin-visitor-area up_st_admin_visitor">
      <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Role Permission</h1>
        <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span>Dashboard</span>
          <span>|</span>
          <span>System Settings</span>
          <span>|</span>
          <span>Role Permission</span>
        </div>
      </div>

      <div style={{ ...boxStyle(), marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>
            Assign Permission {activeRole ? `(${activeRole.name})` : ""}
          </h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/roles" style={{ ...buttonStyle("#6b7280"), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Back To Role
            </Link>
            <select
              value={roleId ?? ""}
              onChange={(e) => onChangeRole(e.target.value)}
              style={{ height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", minWidth: 220 }}
              disabled={loadingRoles || loadingTree || saving}
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <button type="button" onClick={save} disabled={!roleId || loadingTree || saving} style={{ ...buttonStyle(), display: "inline-flex", alignItems: "center", gap: 8 }}>
              {saving ? <span style={spinnerStyle()} aria-hidden="true" /> : null}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {error && <div style={{ color: "var(--warning)", marginBottom: 10 }}>{error}</div>}
      {message && <div style={{ color: "var(--primary)", marginBottom: 10 }}>{message}</div>}

      <div style={{ ...boxStyle(), position: "relative" }}>
        {loadingTree ? <div style={{ color: "var(--text-muted)", marginBottom: 10 }}>Loading permissions...</div> : null}
        {!loadingTree && modules.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>No modules available for this role.</div>
        ) : null}

        {loadingTree || saving ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
              borderRadius: "var(--radius)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--text)",
              }}
            >
              <span
                style={{
                  ...spinnerStyle(16),
                  border: "2px solid rgba(0, 0, 0, 0.15)",
                  borderTopColor: "var(--primary)",
                }}
                aria-hidden="true"
              />
              <span>{saving ? "Saving permissions..." : "Loading permissions..."}</span>
            </div>
          </div>
        ) : null}

        {!loadingTree && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 12 }}>
            {modules.map((moduleRow) => {
          const total = moduleRow.permissions.length;
          const checkedCount = moduleRow.permissions.filter((p) => selectedIds.has(p.id)).length;
          const allChecked = total > 0 && checkedCount === total;
          const expanded = !!expandedModules[moduleRow.module];

          return (
            <div key={moduleRow.module} style={{ border: "1px solid #8b5cf6", borderRadius: 10, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => toggleModuleExpanded(moduleRow.module)}
                style={{
                  width: "100%",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  color: "#fff",
                  background: "linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)",
                  fontWeight: 600,
                }}
              >
                <span>{prettyModuleName(moduleRow.module)}</span>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{expanded ? "-" : "+"}</span>
              </button>

              {expanded ? (
                <div style={{ padding: 10, background: "var(--surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {checkedCount}/{total} selected
                    </span>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input type="checkbox" checked={allChecked} onChange={(e) => toggleModule(moduleRow, e.target.checked)} />
                      Select all
                    </label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                    {moduleRow.permissions.map((permission) => (
                      <label key={permission.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(permission.id)}
                          disabled={loadingTree || saving}
                          onChange={() => togglePermission(permission.id)}
                        />
                        <span>{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
              </div>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
