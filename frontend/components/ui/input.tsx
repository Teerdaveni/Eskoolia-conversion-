import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const style: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid var(--line)",
    fontSize: "14px",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    ...props.style,
  };

  return <input {...props} style={style} />;
}
