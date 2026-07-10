"use client";

import { useActionState } from "react";
import { updatePaperAction } from "@/app/actions/adminPapers";

export function PaperEditForm({
  paper,
}: {
  paper: {
    id: string;
    title: string;
    isFree: boolean;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    negativeMarkingRatio: number;
  };
}) {
  const [state, action, pending] = useActionState(updatePaperAction, undefined);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="id" value={paper.id} />

      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" defaultValue={paper.title} required />

      <label htmlFor="durationMinutes">Duration (minutes)</label>
      <input id="durationMinutes" name="durationMinutes" type="number" defaultValue={paper.durationMinutes} required />

      <label htmlFor="totalQuestions">Total questions (label only — actual count is the active question rows below)</label>
      <input id="totalQuestions" name="totalQuestions" type="number" defaultValue={paper.totalQuestions} required />

      <label htmlFor="totalMarks">Total marks</label>
      <input id="totalMarks" name="totalMarks" type="number" defaultValue={paper.totalMarks} required />

      <label htmlFor="negativeMarkingRatio">Negative marking ratio</label>
      <input
        id="negativeMarkingRatio"
        name="negativeMarkingRatio"
        type="number"
        step="0.01"
        defaultValue={paper.negativeMarkingRatio}
        required
      />

      <label>
        <input type="checkbox" name="isFree" defaultChecked={paper.isFree} /> Free paper
      </label>

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
