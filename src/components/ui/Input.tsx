import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/** Themed text input. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["ee-input", className].filter(Boolean).join(" ")} {...rest} />;
}

/** Themed textarea (shares the input styling). */
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={["ee-input", className].filter(Boolean).join(" ")} {...rest} />;
}

/** Label + control + optional hint/error wrapper for consistent form rows. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ee-field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <span className="ee-hint">{hint}</span>}
      {error && <span className="ee-err">{error}</span>}
    </div>
  );
}
