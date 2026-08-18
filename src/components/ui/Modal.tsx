"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Overlay modal. By default closing navigates back (router.back()) — which is
 * what an intercepting-route modal wants; pass `onClose` to override.
 * Closes on backdrop click and Escape.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const close = onClose ?? (() => router.back());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ee-modal-overlay" onClick={close}>
      <div className="ee-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="ee-modal__head">
          {title && <h2>{title}</h2>}
          <button type="button" className="ee-modal__close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="ee-modal__body">{children}</div>
      </div>
    </div>
  );
}
