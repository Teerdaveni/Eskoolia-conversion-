"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ItemCategoryPanel } from "@/components/inventory/ItemCategoryPanel";
import { ItemStorePanel } from "@/components/inventory/ItemStorePanel";
import { SupplierPanel } from "@/components/inventory/SupplierPanel";
import { ItemPanel } from "@/components/inventory/ItemPanel";
import { ItemReceivePanel } from "@/components/inventory/ItemReceivePanel";
import { ItemIssuePanel } from "@/components/inventory/ItemIssuePanel";
import { ItemSellPanel } from "@/components/inventory/ItemSellPanel";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("categories");

  const tabs = [
    { id: "categories", label: "Categories", icon: "📦" },
    { id: "stores", label: "Stores", icon: "🏢" },
    { id: "suppliers", label: "Suppliers", icon: "🤝" },
    { id: "items", label: "Items", icon: "📋" },
    { id: "receives", label: "Receives", icon: "📥" },
    { id: "issues", label: "Issues", icon: "📤" },
    { id: "sales", label: "Sales", icon: "💰" },
  ];

  return (
    <div>
      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "16px",
          borderBottom: "1px solid var(--line)",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === tab.id ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? "600" : "500",
              whiteSpace: "nowrap",
              transition: "all 200ms",
            }}
          >
            <span style={{ marginRight: "8px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        {activeTab === "categories" && <ItemCategoryPanel />}
        {activeTab === "stores" && <ItemStorePanel />}
        {activeTab === "suppliers" && <SupplierPanel />}
        {activeTab === "items" && <ItemPanel />}
        {activeTab === "receives" && <ItemReceivePanel />}
        {activeTab === "issues" && <ItemIssuePanel />}
        {activeTab === "sales" && <ItemSellPanel />}
      </div>
    </div>
  );
}
