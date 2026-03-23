import { ModuleCard } from "@/components/ui/ModuleCard";
import { moduleRoadmap } from "@/lib/modules";

export default function DashboardPage() {
  return (
    <section>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>School ERP Rewrite Dashboard</h1>
        <p style={{ marginTop: 8, color: "var(--text-muted)" }}>
          Track module-by-module migration progress and delivery status.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {moduleRoadmap.map((module) => (
          <ModuleCard key={module.key} title={module.title} status={module.status} />
        ))}
      </div>
    </section>
  );
}
