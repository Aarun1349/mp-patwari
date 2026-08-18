import type { ReactNode } from "react";

export type AlertVariant = "error" | "warning" | "info" | "success";

/**
 * Reusable inline message / banner. One component for every error, warning,
 * info and success message across the app — styled from design tokens
 * (see theme.css `.ee-alert`).
 */
export function Alert({
  variant = "info",
  children,
}: {
  variant?: AlertVariant;
  children: ReactNode;
}) {
  return (
    <div className={`ee-alert ee-alert--${variant}`} role={variant === "error" ? "alert" : undefined}>
      {children}
    </div>
  );
}
