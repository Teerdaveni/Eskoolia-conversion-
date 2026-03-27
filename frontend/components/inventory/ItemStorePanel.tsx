"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type ItemStore = {
  id: number;
  title: string;
  location?: string;
  description?: string;
  created_at: string;
};

export function ItemStorePanel() {
  const [stores, setStores] = useState<ItemStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", location: "", description: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequestWithRefresh<any>("/api/v1/core/item-stores/", {
        headers: { "Content-Type": "application/json" },
      });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setStores(list);
    } catch (err) {
      setError("Unable to load stores. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/v1/core/item-stores/${editingId}/` : "/api/v1/core/item-stores/";
      
      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          description: formData.description,
        }),
      });

      setFormData({ title: "", location: "", description: "" });
      setEditingId(null);
      setShowForm(false);
      await loadStores();
    } catch (err) {
      setError("Unable to save store.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/item-stores/${id}/`, { method: "DELETE" });
      await loadStores();
    } catch (err) {
      setError("Unable to delete store.");
    }
  };

  const filtered = stores.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ padding: "16px" }}>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Item Stores</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: "", location: "", description: "" }); }}>
          {showForm ? "Cancel" : "Add Store"}
        </Button>
      </div>

      {error && <div style={{ color: "red", padding: "8px", backgroundColor: "#ffe6e6", borderRadius: "4px" }}>{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Main Warehouse"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Location</label>
              <Input
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Building A, Level 3"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Store description"
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
          placeholder="Search stores..."
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
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Title</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Location</th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((s) => (
              <tr key={s.id}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.title}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.location || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(s.id);
                      setFormData({ title: s.title, location: s.location || "", description: s.description || "" });
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
