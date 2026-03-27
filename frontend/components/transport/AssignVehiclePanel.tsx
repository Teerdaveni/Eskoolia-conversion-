"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AssignVehicle = {
  id: number;
  vehicle: number;
  vehicle_no: string;
  route: number;
  route_title: string;
  active_status: boolean;
  created_at: string;
};

type Vehicle = {
  id: number;
  vehicle_no: string;
};

type TransportRoute = {
  id: number;
  title: string;
};

export function AssignVehiclePanel() {
  const [assignments, setAssignments] = useState<AssignVehicle[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ vehicle: "", route: "" });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [assignData, vehData, routeData] = await Promise.all([
        apiRequestWithRefresh<any>("/api/v1/core/assign-vehicles/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/vehicles/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/transport-routes/", {
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      
      const assignList = Array.isArray(assignData) ? assignData : (assignData?.results || []);
      const vehicleList = Array.isArray(vehData) ? vehData : (vehData?.results || []);
      const routeList = Array.isArray(routeData) ? routeData : (routeData?.results || []);
      
      setAssignments(assignList);
      setVehicles(vehicleList);
      setRoutes(routeList);
    } catch (err) {
      setError("Unable to load data. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/v1/core/assign-vehicles/${editingId}/` : "/api/v1/core/assign-vehicles/";
      
      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: parseInt(formData.vehicle),
          route: parseInt(formData.route),
          active_status: true,
        }),
      });

      setFormData({ vehicle: "", route: "" });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError("Unable to save assignment.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/assign-vehicles/${id}/`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError("Unable to delete assignment.");
    }
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Assign Vehicles to Routes</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ vehicle: "", route: "" }); }}>
          {showForm ? "Cancel" : "Add Assignment"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Vehicle *</label>
              <select
                required
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicle_no}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Route *</label>
              <select
                required
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select Route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
          </form>
        </Card>
      )}

      {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--line)" }}>
          <thead style={{ backgroundColor: "#f3f4f6" }}>
            <tr>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Vehicle</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Route</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} style={{ border: "1px solid var(--line)", backgroundColor: "#fff" }}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{a.vehicle_no}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{a.route_title}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{a.active_status ? "Active" : "Inactive"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(a.id);
                      setFormData({ vehicle: a.vehicle.toString(), route: a.route.toString() });
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>
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
