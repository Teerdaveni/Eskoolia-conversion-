"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Vehicle = {
  id: number;
  vehicle_no: string;
  vehicle_model: string;
  made_year?: number;
  note?: string;
  driver?: number;
  driver_name?: string;
  active_status: boolean;
  created_at: string;
};

type Staff = {
  id: number;
  staff_no: string;
  first_name: string;
  last_name: string;
  full_name?: string;
};

export function VehiclePanel() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ vehicle_no: "", vehicle_model: "", made_year: "", note: "", driver: "" });

  const loadVehiclesAndDrivers = async () => {
    try {
      setLoading(true);
      setError("");
      const [vehicleData, driverData] = await Promise.all([
        apiRequestWithRefresh<any>("/api/v1/core/vehicles/", {
          headers: { "Content-Type": "application/json" },
        }),
        // Fetch staff members with driver role (drivers_only=true filters by driver role)
        apiRequestWithRefresh<any>("/api/v1/hr/staff/?drivers_only=true&page_size=500", {
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      // Handle both array and paginated responses from DRF
      const vehicleList = Array.isArray(vehicleData) ? vehicleData : (vehicleData?.results || []);
      const driverList = Array.isArray(driverData) ? driverData : (driverData?.results || []);
      setVehicles(vehicleList);
      setDrivers(driverList);
    } catch (err) {
      setError("Unable to load data. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVehiclesAndDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/v1/core/vehicles/${editingId}/` : "/api/v1/core/vehicles/";
      
      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_no: formData.vehicle_no,
          vehicle_model: formData.vehicle_model,
          made_year: formData.made_year ? parseInt(formData.made_year) : null,
          note: formData.note,
          driver: formData.driver ? parseInt(formData.driver) : null,
          active_status: true,
        }),
      });

      setFormData({ vehicle_no: "", vehicle_model: "", made_year: "", note: "", driver: "" });
      setEditingId(null);
      setShowForm(false);
      await loadVehiclesAndDrivers();
    } catch (err) {
      setError("Unable to save vehicle.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/vehicles/${id}/`, { method: "DELETE" });
      await loadVehiclesAndDrivers();
    } catch (err) {
      setError("Unable to delete vehicle.");
    }
  };

  const filtered = vehicles.filter((v) =>
    v.vehicle_no.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicle_model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Vehicles</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ vehicle_no: "", vehicle_model: "", made_year: "", note: "", driver: "" }); }}>
          {showForm ? "Cancel" : "Add Vehicle"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Vehicle No *</label>
              <Input
                required
                value={formData.vehicle_no}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, vehicle_no: e.target.value })}
                placeholder="ABC-123"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Vehicle Model *</label>
              <Input
                required
                value={formData.vehicle_model}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, vehicle_model: e.target.value })}
                placeholder="Toyota Coaster"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Made Year</label>
              <Input
                type="number"
                value={formData.made_year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, made_year: e.target.value })}
                placeholder="2023"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Driver</label>
              <select
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
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
                <option value="">Select Driver (Optional)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.staff_no})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional notes"
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                rows={3}
              />
            </div>
            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
          </form>
        </Card>
      )}

      <div>
        <Input
          placeholder="Search vehicles..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          style={{ marginBottom: "16px" }}
        />
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--line)" }}>
          <thead style={{ backgroundColor: "#f3f4f6" }}>
            <tr>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Vehicle No</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Model</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Year</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Driver</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} style={{ border: "1px solid var(--line)", backgroundColor: "#fff" }}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{v.vehicle_no}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{v.vehicle_model}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{v.made_year || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{v.driver_name || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{v.active_status ? "Active" : "Inactive"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(v.id);
                      setFormData({ vehicle_no: v.vehicle_no, vehicle_model: v.vehicle_model, made_year: v.made_year?.toString() || "", note: v.note || "", driver: v.driver?.toString() || "" });
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(v.id)}>
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
