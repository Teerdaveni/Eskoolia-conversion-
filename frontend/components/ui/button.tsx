import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function Button({ 
  variant = "default", 
  size = "md", 
  className = "", 
  ...props 
}: ButtonProps) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: "4px 8px",
      fontSize: "12px",
    },
    md: {
      padding: "8px 16px",
      fontSize: "14px",
    },
    lg: {
      padding: "12px 24px",
      fontSize: "16px",
    },
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: "6px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
    ...sizeStyles[size],
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--primary)",
      color: "#fff",
      border: "1px solid var(--primary)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--primary)",
      border: "1px solid var(--line)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text)",
      border: "none",
    },
    destructive: {
      backgroundColor: "var(--danger)",
      color: "#fff",
      border: "1px solid var(--danger)",
    },
  };

  const style = { ...baseStyles, ...variantStyles[variant], ...props.style };

  return <button {...props} style={style} className={className} />;
}
