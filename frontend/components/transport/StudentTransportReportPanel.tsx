"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StudentTransport = {
  id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  current_class?: number;
  transport_route_title?: string;
  vehicle_no?: string;
  is_active: boolean;
};

type TransportRoute = {
  id: number;
  title: string;
};

type Vehicle = {
  id: number;
  vehicle_no: string;
};

export function StudentTransportReportPanel() {
  const [students, setStudents] = useState<StudentTransport[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ route: "", vehicle: "", activeOnly: true });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [studData, routeData, vehData] = await Promise.all([
        apiRequestWithRefresh<any>("/api/v1/students/students/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/transport-routes/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/vehicles/", {
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      
      const studentList = Array.isArray(studData) ? studData : (studData?.results || []);
      const routeList = Array.isArray(routeData) ? routeData : (routeData?.results || []);
      const vehicleList = Array.isArray(vehData) ? vehData : (vehData?.results || []);
      
      setStudents(studentList);
      setRoutes(routeList);
      setVehicles(vehicleList);
    } catch (err) {
      setError("Unable to load report data. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = students.filter((s) => {
    if (filters.activeOnly && !s.is_active) return false;
    if (filters.route && s.transport_route_title !== routes.find(r => r.id === parseInt(filters.route))?.title) return false;
    if (filters.vehicle && s.vehicle_no !== vehicles.find(v => v.id === parseInt(filters.vehicle))?.vehicle_no) return false;
    return true;
  });

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Student Transport Report</h1>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Filter by Route</label>
            <select
              value={filters.route}
              onChange={(e) => setFilters({ ...filters, route: e.target.value })}
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
              <option value="">All Routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Filter by Vehicle</label>
            <select
              value={filters.vehicle}
              onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
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
              <option value="">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.vehicle_no}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "8px" }}>
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
              />
              <span style={{ fontSize: "14px" }}>Active Only</span>
            </label>
          </div>
        </div>
      </Card>

      {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>Total Students: {filtered.length}</div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--line)" }}>
          <thead style={{ backgroundColor: "#f3f4f6" }}>
            <tr>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Admission No</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Student Name</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Route</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Vehicle</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ border: "1px solid var(--line)", backgroundColor: "#fff" }}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.admission_no}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.first_name} {s.last_name}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.transport_route_title || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.vehicle_no || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
