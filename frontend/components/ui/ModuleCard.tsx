type Props = {
  title: string;
  status: "planned" | "in-progress" | "done";
};

const colorMap = {
  planned: "#98a2b3",
  "in-progress": "#2166d1",
  done: "#0e9f6e",
};

export function ModuleCard({ title, status }: Props) {
  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: colorMap[status],
            display: "inline-block",
          }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: 13, textTransform: "capitalize" }}>{status}</span>
      </div>
    </article>
  );
}
