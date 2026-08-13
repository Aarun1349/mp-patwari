"use client";

import { useActionState, useState } from "react";
import type { ExamActionState } from "@/app/actions/adminExams";

type ExamAction = (prev: ExamActionState, formData: FormData) => Promise<ExamActionState>;

export interface ExamFormValues {
  id: string;
  name: string;
  slug: string;
  board: string | null;
  shortName: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** name → URL slug: lowercase, non-alphanumerics to hyphens, capped at the 50-char
 *  schema limit so it can never trip the "too big" validation. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

export function ExamForm({ action, exam }: { action: ExamAction; exam?: ExamFormValues }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [name, setName] = useState(exam?.name ?? "");
  const [slug, setSlug] = useState(exam?.slug ?? "");
  // Once an existing exam is loaded, or the admin edits the slug by hand, stop
  // auto-syncing it from the name.
  const [slugEdited, setSlugEdited] = useState(Boolean(exam?.slug));

  return (
    <form action={formAction} className="auth-form">
      {exam && <input type="hidden" name="id" value={exam.id} />}

      <label htmlFor="name">Exam name</label>
      <input
        id="name"
        name="name"
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugEdited) setSlug(slugify(e.target.value));
        }}
        placeholder="MP Police Constable"
        required
      />

      <label htmlFor="slug">Slug (URL id) — auto-filled from the name</label>
      <input
        id="slug"
        name="slug"
        type="text"
        value={slug}
        onChange={(e) => {
          setSlugEdited(true);
          setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").slice(0, 50));
        }}
        placeholder="mp-police-constable"
        required
      />

      <label htmlFor="board">Board (optional)</label>
      <input id="board" name="board" type="text" defaultValue={exam?.board ?? ""} placeholder="MPESB" />

      <label htmlFor="shortName">Short name (optional)</label>
      <input id="shortName" name="shortName" type="text" defaultValue={exam?.shortName ?? ""} placeholder="Constable" />

      <label htmlFor="description">Description (optional)</label>
      <textarea id="description" name="description" defaultValue={exam?.description ?? ""} rows={3} />

      <label htmlFor="sortOrder">Sort order (landing position)</label>
      <input id="sortOrder" name="sortOrder" type="number" defaultValue={exam?.sortOrder ?? 0} />

      <label>
        <input type="checkbox" name="isActive" defaultChecked={exam?.isActive ?? true} /> Listed on landing
      </label>

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : exam ? "Save exam" : "Create exam"}
      </button>
    </form>
  );
}
