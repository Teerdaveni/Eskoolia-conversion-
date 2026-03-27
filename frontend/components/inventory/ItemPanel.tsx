"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type ItemCategory = { id: number; title: string };
type Supplier = { id: number; name: string };
type Item = {
  id: number;
  item_code: string;
  name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  unit_cost: number;
  unit_price: number;
  category_id: number;
  category_title: string;
  supplier_id: number;
  supplier_name: string;
  created_at: string;
};

export function ItemPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    quantity: 0,
    unit: "piece",
    reorder_level: 0,
    unit_cost: 0,
    unit_price: 0,
    category: "",
    supplier: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [itemsData, categoriesData, suppliersData] = await Promise.all([
        apiRequestWithRefresh<any>("/api/v1/core/items/", { headers: { "Content-Type": "application/json" } }),
        apiRequestWithRefresh<any>("/api/v1/core/item-categories/", { headers: { "Content-Type": "application/json" } }),
        apiRequestWithRefresh<any>("/api/v1/core/suppliers/", { headers: { "Content-Type": "application/json" } }),
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.results || []));
      setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []));
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : (suppliersData?.results || []));
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
      const url = editingId ? `/api/v1/core/items/${editingId}/` : "/api/v1/core/items/";
      
      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_code: formData.item_code,
          name: formData.name,
          quantity: parseFloat(formData.quantity as any),
          unit: formData.unit,
          reorder_level: parseFloat(formData.reorder_level as any),
          unit_cost: parseFloat(formData.unit_cost as any),
          unit_price: parseFloat(formData.unit_price as any),
          category: formData.category || null,
          supplier: formData.supplier || null,
        }),
      });

      setFormData({
        item_code: "",
        name: "",
        quantity: 0,
        unit: "piece",
        reorder_level: 0,
        unit_cost: 0,
        unit_price: 0,
        category: "",
        supplier: "",
      });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError("Unable to save item.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/items/${id}/`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError("Unable to delete item.");
    }
  };

  const filtered = items.filter(
    (i) =>
      i.item_code.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ padding: "16px" }}>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Items</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              item_code: "",
              name: "",
              quantity: 0,
              unit: "piece",
              reorder_level: 0,
              unit_cost: 0,
              unit_price: 0,
              category: "",
              supplier: "",
            });
          }}
        >
          {showForm ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {error && <div style={{ color: "red", padding: "8px", backgroundColor: "#ffe6e6", borderRadius: "4px" }}>{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Item Code *
                </label>
                <Input
                  required
                  value={formData.item_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, item_code: e.target.value })
                  }
                  placeholder="e.g. ITEM001"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Item Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Item name"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, category: e.target.value })
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
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, supplier: e.target.value })
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
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Quantity
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, unit: e.target.value })
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
                  <option value="piece">Piece</option>
                  <option value="box">Box</option>
                  <option value="dozen">Dozen</option>
                  <option value="meter">Meter</option>
                  <option value="kg">Kg</option>
                  <option value="liter">Liter</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Reorder Level
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.reorder_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Unit Cost
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Unit Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
          </form>
        </Card>
      )}

      <div>
        <Input
          placeholder="Search items by code or name..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={{ marginBottom: "16px" }}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface-secondary)" }}>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Code
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Name
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Category
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right", fontWeight: "600" }}>
                  Qty
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right", fontWeight: "600" }}>
                  Unit Cost
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right", fontWeight: "600" }}>
                  Unit Price
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((i) => {
                const isLow = i.quantity < i.reorder_level;
                return (
                  <tr
                    key={i.id}
                    style={{ backgroundColor: isLow ? "#fff3cd" : "transparent" }}
                  >
                    <td style={{ border: "1px solid var(--line)", padding: "12px" }}>
                      {isLow && (
                        <span style={{ marginRight: "8px", display: "inline-flex" }}>
                          <AlertCircle size={16} color="orange" />
                        </span>
                      )}
                      {i.item_code}
                    </td>
                    <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{i.name}</td>
                    <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{i.category_title || "-"}</td>
                    <td style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right" }}>
                      {i.quantity} {i.unit}
                    </td>
                    <td style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right" }}>
                      {parseFloat(i.unit_cost as any).toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right" }}>
                      {parseFloat(i.unit_price as any).toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(i.id);
                          setFormData({
                            item_code: i.item_code,
                            name: i.name,
                            quantity: i.quantity,
                            unit: i.unit,
                            reorder_level: i.reorder_level,
                            unit_cost: i.unit_cost,
                            unit_price: i.unit_price,
                            category: i.category_id?.toString() || "",
                            supplier: i.supplier_id?.toString() || "",
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(i.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
