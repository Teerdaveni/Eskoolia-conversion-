"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Supplier = {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  created_at: string;
};

export function SupplierPanel() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    payment_terms: "NET30",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequestWithRefresh<any>("/api/v1/core/suppliers/", {
        headers: { "Content-Type": "application/json" },
      });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setSuppliers(list);
    } catch (err) {
      setError("Unable to load suppliers. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/v1/core/suppliers/${editingId}/` : "/api/v1/core/suppliers/";
      
      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setFormData({
        name: "",
        contact: "",
        email: "",
        phone: "",
        address: "",
        tax_id: "",
        payment_terms: "NET30",
      });
      setEditingId(null);
      setShowForm(false);
      await loadSuppliers();
    } catch (err) {
      setError("Unable to save supplier.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/suppliers/${id}/`, { method: "DELETE" });
      await loadSuppliers();
    } catch (err) {
      setError("Unable to delete supplier.");
    }
  };

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ padding: "16px" }}>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Suppliers</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: "", contact: "", email: "", phone: "", address: "", tax_id: "", payment_terms: "NET30" }); }}>
          {showForm ? "Cancel" : "Add Supplier"}
        </Button>
      </div>

      {error && <div style={{ color: "red", padding: "8px", backgroundColor: "#ffe6e6", borderRadius: "4px" }}>{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Contact Person</label>
                <Input
                  value={formData.contact}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Address</label>
              <textarea
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Tax ID</label>
                <Input
                  value={formData.tax_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="Tax ID / VAT number"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Payment Terms</label>
                <select
                  value={formData.payment_terms}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, payment_terms: e.target.value })}
                  style={{
                    width: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="NET15">NET 15</option>
                  <option value="NET30">NET 30</option>
                  <option value="NET45">NET 45</option>
                  <option value="NET60">NET 60</option>
                  <option value="COD">COD</option>
                  <option value="PREPAID">PREPAID</option>
                </select>
              </div>
            </div>

            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
          </form>
        </Card>
      )}

      <div>
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={{ marginBottom: "16px" }}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--surface-secondary)" }}>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Contact</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Email</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Phone</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((s) => (
              <tr key={s.id}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.name}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.contact || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.email || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.phone || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(s.id);
                      setFormData({
                        name: s.name,
                        contact: s.contact || "",
                        email: s.email || "",
                        phone: s.phone || "",
                        address: s.address || "",
                        tax_id: s.tax_id || "",
                        payment_terms: s.payment_terms || "NET30",
                      });
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px", backgroundColor: "var(--surface-secondary)", borderRadius: "4px" }}>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={itemsPerPage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span style={{ fontSize: "14px", minWidth: "100px", textAlign: "center" }}>
              Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
