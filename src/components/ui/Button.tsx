import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

function classes(variant: ButtonVariant, size: ButtonSize, block?: boolean, extra?: string) {
  return [
    "ee-btn",
    `ee-btn--${variant}`,
    size !== "md" && `ee-btn--${size}`,
    block && "ee-btn--block",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Themed button. Icons passed as children inherit the button's colour.
 *  `loading` shows a spinner and disables the button. */
export function Button({
  variant = "primary",
  size = "md",
  block,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
}) {
  return (
    <button className={classes(variant, size, block, className)} disabled={disabled || loading} {...rest}>
      {loading && <span className="ee-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Same look as Button, but renders an anchor (for navigation / links). */
export function ButtonLink({
  variant = "primary",
  size = "md",
  block,
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}) {
  return <a className={classes(variant, size, block, className)} {...rest} />;
}
