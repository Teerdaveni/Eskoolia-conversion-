"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type TransportRoute = {
  id: number;
  title: string;
  fare: string;
  active_status: boolean;
  created_at: string;
};

export function TransportRoutePanel() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", fare: "" });

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequestWithRefresh<any>("/api/v1/core/transport-routes/", {
        headers: { "Content-Type": "application/json" },
      });
      const routeList = Array.isArray(data) ? data : (data?.results || []);
      setRoutes(routeList);
    } catch (err) {
      setError("Unable to load routes. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/v1/core/transport-routes/${editingId}/` : "/api/v1/core/transport-routes/";
      
      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fare: parseFloat(formData.fare),
          active_status: true,
        }),
      });

      setFormData({ title: "", fare: "" });
      setEditingId(null);
      setShowForm(false);
      await loadRoutes();
    } catch (err) {
      setError("Unable to save route.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/transport-routes/${id}/`, { method: "DELETE" });
      await loadRoutes();
    } catch (err) {
      setError("Unable to delete route.");
    }
  };

  const filtered = routes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Transport Routes</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: "", fare: "" }); }}>
          {showForm ? "Cancel" : "Add Route"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Route Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Route A - City Center"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Fare *</label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.fare}
                onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                placeholder="500.00"
              />
            </div>
            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
          </form>
        </Card>
      )}

      <div>
        <Input
          placeholder="Search routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "16px" }}
        />
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--line)" }}>
          <thead style={{ backgroundColor: "#f3f4f6" }}>
            <tr>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Route Title</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Fare</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ border: "1px solid var(--line)", backgroundColor: "#fff" }}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{r.title}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{r.fare}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{r.active_status ? "Active" : "Inactive"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(r.id);
                      setFormData({ title: r.title, fare: r.fare });
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
