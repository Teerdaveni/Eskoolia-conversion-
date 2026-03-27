import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, className = "", ...props }: CardProps) {
  const style: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: "16px",
    ...props.style,
  };

  return (
    <div {...props} style={style} className={className}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: CardProps) {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "16px",
    ...props.style,
  };

  return (
    <div {...props} style={style} className={className}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }: CardProps) {
  const style: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: "600",
    lineHeight: "1",
    ...props.style,
  };

  return (
    <h2 {...props} style={style} className={className}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className = "", ...props }: CardProps) {
  const style: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    ...props.style,
  };

  return (
    <p {...props} style={style} className={className}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }: CardProps) {
  const style: React.CSSProperties = {
    paddingTop: "0px",
    ...props.style,
  };

  return (
    <div {...props} style={style} className={className}>
      {children}
    </div>
  );
}
