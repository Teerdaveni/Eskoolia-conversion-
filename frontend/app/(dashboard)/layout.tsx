import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuthGate } from "@/components/layout/AuthGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="erp-shell">
        <Sidebar />
        <div>
          <Topbar />
          <main style={{ padding: 18 }}>{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
