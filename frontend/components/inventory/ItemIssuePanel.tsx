"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type ItemStore = { id: number; title: string };
type Item = { id: number; name: string; quantity: number };
type ItemIssue = {
  id: number;
  store_id: number;
  store_title: string;
  item_id: number;
  item_name: string;
  quantity: number;
  subject?: string;
  notes?: string;
  issued_by_name?: string;
  created_at: string;
};

export function ItemIssuePanel() {
  const [issues, setIssues] = useState<ItemIssue[]>([]);
  const [stores, setStores] = useState<ItemStore[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    store: "",
    item: "",
    quantity: 0,
    subject: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [issuesData, storesData, itemsData] = await Promise.all([
        apiRequestWithRefresh<any>("/api/v1/core/item-issues/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/item-stores/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/items/", {
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      setIssues(Array.isArray(issuesData) ? issuesData : (issuesData?.results || []));
      setStores(Array.isArray(storesData) ? storesData : (storesData?.results || []));
      setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.results || []));
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
      const url = editingId ? `/api/v1/core/item-issues/${editingId}/` : "/api/v1/core/item-issues/";

      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: parseInt(formData.store),
          item: parseInt(formData.item),
          quantity: parseFloat(formData.quantity as any),
          subject: formData.subject,
          notes: formData.notes,
        }),
      });

      setFormData({
        store: "",
        item: "",
        quantity: 0,
        subject: "",
        notes: "",
      });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError("Unable to save issue. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/item-issues/${id}/`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError("Unable to delete issue.");
    }
  };

  const filtered = issues.filter(
    (i) =>
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.store_title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ padding: "16px" }}>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Item Issues</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              store: "",
              item: "",
              quantity: 0,
              subject: "",
              notes: "",
            });
          }}
        >
          {showForm ? "Cancel" : "Add Issue"}
        </Button>
      </div>

      {error && (
        <div style={{ color: "red", padding: "8px", backgroundColor: "#ffe6e6", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Store *
                </label>
                <select
                  required
                  value={formData.store}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, store: e.target.value })
                  }
                  style={{
                    width: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Item *
                </label>
                <select
                  required
                  value={formData.item}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, item: e.target.value })
                  }
                  style={{
                    width: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Available: {i.quantity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Quantity *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Subject
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="e.g. Office Use, Classroom"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
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
          placeholder="Search by item or store..."
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
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                Item
              </th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                Store
              </th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right", fontWeight: "600" }}>
                Quantity
              </th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                Subject
              </th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                Issued By
              </th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                Date
              </th>
              <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((i) => (
              <tr key={i.id}>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{i.item_name}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{i.store_title}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right" }}>{i.quantity}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{i.subject || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{i.issued_by_name || "-"}</td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>
                  {new Date(i.created_at).toLocaleDateString()}
                </td>
                <td style={{ border: "1px solid var(--line)", padding: "12px" }}>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(i.id)}>
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
