import type { CSSProperties } from "react";

/** Small inline spinner. Inherits `currentColor`, so it matches its context. */
export function Spinner({ size, label = "Loading" }: { size?: number; label?: string }) {
  const style: CSSProperties | undefined = size ? { width: size, height: size } : undefined;
  return <span className="ee-spinner" style={style} role="status" aria-label={label} />;
}

/** Full-area loading state — the fallback for route-level `loading.tsx` while the
 *  server fetches data, and any full-panel loading placeholder. */
export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="ee-loading">
      <span className="ee-spinner" />
      <span>{message}</span>
    </div>
  );
}
