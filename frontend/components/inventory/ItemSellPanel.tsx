"use client";

import { useEffect, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type Item = { id: number; name: string; unit_price: number };
type LineItem = { item: number; quantity: number; unit_price: number; id?: number };
type ItemSell = {
  id: number;
  sell_date: string;
  sold_to?: string;
  total_amount: number;
  discount: number;
  tax: number;
  paid_amount: number;
  payment_status: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
};

export function ItemSellPanel() {
  const [sells, setSells] = useState<ItemSell[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    sell_date: new Date().toISOString().split("T")[0],
    sold_to: "",
    total_amount: 0,
    discount: 0,
    tax: 0,
    paid_amount: 0,
    payment_status: "U",
    notes: "",
    line_items: [] as LineItem[],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sellsData, itemsData] = await Promise.all([
        apiRequestWithRefresh<any>("/api/v1/core/item-sells/", {
          headers: { "Content-Type": "application/json" },
        }),
        apiRequestWithRefresh<any>("/api/v1/core/items/", {
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      setSells(Array.isArray(sellsData) ? sellsData : (sellsData?.results || []));
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

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { item: 0, quantity: 1, unit_price: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...formData.line_items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, line_items: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.line_items.length === 0) {
      setError("Please add at least one line item");
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/v1/core/item-sells/${editingId}/` : "/api/v1/core/item-sells/";

      await apiRequestWithRefresh(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sell_date: formData.sell_date,
          sold_to: formData.sold_to,
          total_amount: parseFloat(formData.total_amount as any),
          discount: parseFloat(formData.discount as any),
          tax: parseFloat(formData.tax as any),
          paid_amount: parseFloat(formData.paid_amount as any),
          payment_status: formData.payment_status,
          notes: formData.notes,
          line_items: formData.line_items.map((li) => ({
            item: li.item,
            quantity: parseFloat(li.quantity as any),
            unit_price: parseFloat(li.unit_price as any),
          })),
        }),
      });

      setFormData({
        sell_date: new Date().toISOString().split("T")[0],
        sold_to: "",
        total_amount: 0,
        discount: 0,
        tax: 0,
        paid_amount: 0,
        payment_status: "U",
        notes: "",
        line_items: [],
      });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError("Unable to save sell. " + (err instanceof Error ? err.message : ""));
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequestWithRefresh(`/api/v1/core/item-sells/${id}/`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError("Unable to delete sell.");
    }
  };

  const paymentStatusDisplay = {
    P: "Paid",
    U: "Unpaid",
    PP: "Partially Paid",
  } as Record<string, string>;

  const filtered = sells.filter(
    (s) =>
      (s.sold_to?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      s.sell_date.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ padding: "16px" }}>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Item Sales</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              sell_date: new Date().toISOString().split("T")[0],
              sold_to: "",
              total_amount: 0,
              discount: 0,
              tax: 0,
              paid_amount: 0,
              payment_status: "U",
              notes: "",
              line_items: [],
            });
          }}
        >
          {showForm ? "Cancel" : "Add Sale"}
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
                  Sale Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.sell_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, sell_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Sold To
                </label>
                <Input
                  value={formData.sold_to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, sold_to: e.target.value })
                  }
                  placeholder="Customer name or reference"
                />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Line Items</h3>
                <Button type="button" size="sm" onClick={addLineItem}>
                  <Plus size={16} style={{ marginRight: "4px" }} /> Add Item
                </Button>
              </div>

              {formData.line_items.length === 0 ? (
                <div style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", textAlign: "center" }}>
                  No items added yet
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {formData.line_items.map((li, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
                          Item
                        </label>
                        <select
                          required
                          value={li.item}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateLineItem(idx, "item", parseInt(e.target.value))
                          }
                          style={{
                            width: "100%",
                            border: "1px solid var(--line)",
                            borderRadius: "4px",
                            padding: "6px",
                            fontSize: "12px",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="">Select item</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
                          Qty
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={li.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateLineItem(idx, "quantity", parseFloat(e.target.value))
                          }
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
                          Unit Price
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={li.unit_price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateLineItem(idx, "unit_price", parseFloat(e.target.value))
                          }
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeLineItem(idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Total Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Discount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Tax
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Paid Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.paid_amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                  Payment Status
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, payment_status: e.target.value })
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
                  <option value="U">Unpaid</option>
                  <option value="PP">Partially Paid</option>
                  <option value="P">Paid</option>
                </select>
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
                rows={2}
              />
            </div>

            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
          </form>
        </Card>
      )}

      <div>
        <Input
          placeholder="Search by customer or date..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={{ marginBottom: "16px" }}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface-secondary)" }}>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Date
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Sold To
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right", fontWeight: "600" }}>
                  Amount
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right", fontWeight: "600" }}>
                  Paid
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Status
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  By
                </th>
                <th style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "left", fontWeight: "600" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((s) => (
                <tr key={s.id}>
                  <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.sell_date}</td>
                  <td style={{ border: "1px solid var(--line)", padding: "12px" }}>{s.sold_to || "-"}</td>
                  <td style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right" }}>
                    {parseFloat(s.total_amount as any).toFixed(2)}
                  </td>
                  <td style={{ border: "1px solid var(--line)", padding: "12px", textAlign: "right" }}>
                    {parseFloat(s.paid_amount as any).toFixed(2)}
                  </td>
                  <td style={{ border: "1px solid var(--line)", padding: "12px" }}>
                    {paymentStatusDisplay[s.payment_status] || s.payment_status}
                  </td>
                  <td style={{ border: "1px solid var(--line)", padding: "12px" }}>
                    {s.created_by_name || "-"}
                  </td>
                  <td style={{ border: "1px solid var(--line)", padding: "12px", display: "flex", gap: "8px" }}>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
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
