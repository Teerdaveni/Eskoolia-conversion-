export function Topbar() {
  return (
    <header
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Workspace</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Migration Command Center</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Admin</span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "var(--primary)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}
