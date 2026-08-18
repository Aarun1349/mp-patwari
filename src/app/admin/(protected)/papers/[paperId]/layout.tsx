import type { ReactNode } from "react";

// Parallel `@modal` slot: lets `questions/[questionId]` render as an overlay
// modal on soft navigation (intercepting route) while the paper page stays
// underneath. A hard load of that URL still renders the full edit page.
export default function PaperDetailLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
