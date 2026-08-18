import type { SelectHTMLAttributes } from "react";

/** Themed dropdown. Renders a native select with a custom chevron so it stays
 *  accessible while matching the design system. */
export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="ee-select-wrap">
      <select className={["ee-select", className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </select>
    </div>
  );
}
