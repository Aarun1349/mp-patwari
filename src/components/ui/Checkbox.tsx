import type { InputHTMLAttributes, ReactNode } from "react";

/** Themed checkbox with an inline label. */
export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={["ee-checkbox", className].filter(Boolean).join(" ")}>
      <input type="checkbox" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}
