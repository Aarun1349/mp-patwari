"use client";

import { useActionState } from "react";
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

export function ExamForm({ action, exam }: { action: ExamAction; exam?: ExamFormValues }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="auth-form" style={{ maxWidth: "480px" }}>
      {exam && <input type="hidden" name="id" value={exam.id} />}

      <label htmlFor="name">Exam name</label>
      <input id="name" name="name" type="text" defaultValue={exam?.name ?? ""} placeholder="MP Police Constable" required />

      <label htmlFor="slug">Slug (URL id)</label>
      <input id="slug" name="slug" type="text" defaultValue={exam?.slug ?? ""} placeholder="mp-police-constable" required />

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
