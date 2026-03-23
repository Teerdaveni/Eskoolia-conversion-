"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "@/components/layout/Sidebar.module.css";
import { sidebarMenu, SidebarItem } from "@/components/layout/sidebar-menu.data";
import { SidebarSection } from "@/components/layout/SidebarSection";

function routeActive(pathname: string, route?: string): boolean {
  if (!route) return false;
  if (pathname === route) return true;
  return pathname.startsWith(`${route}/`);
}

function hasActiveDescendant(item: SidebarItem, pathname: string): boolean {
  if (routeActive(pathname, item.route)) return true;
  if (!item.children || item.children.length === 0) return false;
  return item.children.some((child) => hasActiveDescendant(child, pathname));
}

function buildDefaultExpanded(items: SidebarItem[], pathname: string): Record<string, boolean> {
  const map: Record<string, boolean> = {};

  const walk = (nodes: SidebarItem[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        if (node.id === "student-info" || hasActiveDescendant(node, pathname)) {
          map[node.id] = true;
        }
        walk(node.children);
      }
    });
  };

  walk(items);
  return map;
}

function findActiveId(items: SidebarItem[], pathname: string): string {
  for (const item of items) {
    if (routeActive(pathname, item.route)) {
      return item.id;
    }
    if (item.children && item.children.length > 0) {
      const childMatch = findActiveId(item.children, pathname);
      if (childMatch) return childMatch;
    }
  }
  return "";
}

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    setExpanded(buildDefaultExpanded(sidebarMenu, pathname));
    setActiveId(findActiveId(sidebarMenu, pathname));
  }, []);

  useEffect(() => {
    const selectedFromRoute = findActiveId(sidebarMenu, pathname);
    if (selectedFromRoute) {
      setActiveId(selectedFromRoute);
      setExpanded((prev) => ({ ...buildDefaultExpanded(sidebarMenu, pathname), ...prev }));
    }
  }, [pathname]);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className={styles.aside}>
      <div className={styles.brand}>Eskoolia</div>
      <div className={styles.nav}>
        {sidebarMenu.map((item) => (
          <SidebarSection
            key={item.id}
            item={item}
            pathname={pathname}
            expanded={expanded}
            activeId={activeId}
            depth={0}
            onToggle={toggle}
            onActivate={setActiveId}
          />
        ))}
      </div>
    </aside>
  );
}
