"use client";

import { useActionState } from "react";
import type { QuestionActionState } from "@/app/actions/adminPapers";

export function QuestionForm({
  action,
  paperId,
  sections,
  defaults,
}: {
  action: (state: QuestionActionState, formData: FormData) => Promise<QuestionActionState>;
  paperId: string;
  sections: { id: string; nameEn: string }[];
  defaults?: {
    questionId?: string;
    sectionId: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: "A" | "B" | "C" | "D";
    marks: number;
    negativeMarks: number;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="paperId" value={paperId} />
      {defaults?.questionId && <input type="hidden" name="questionId" value={defaults.questionId} />}

      <label htmlFor="sectionId">Section</label>
      <select id="sectionId" name="sectionId" defaultValue={defaults?.sectionId}>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nameEn}
          </option>
        ))}
      </select>

      <label htmlFor="text">Question text</label>
      <textarea id="text" name="text" rows={3} defaultValue={defaults?.text} required />

      <label htmlFor="optionA">Option A</label>
      <input id="optionA" name="optionA" type="text" defaultValue={defaults?.optionA} required />
      <label htmlFor="optionB">Option B</label>
      <input id="optionB" name="optionB" type="text" defaultValue={defaults?.optionB} required />
      <label htmlFor="optionC">Option C</label>
      <input id="optionC" name="optionC" type="text" defaultValue={defaults?.optionC} required />
      <label htmlFor="optionD">Option D</label>
      <input id="optionD" name="optionD" type="text" defaultValue={defaults?.optionD} required />

      <label htmlFor="correctOption">Correct option</label>
      <select id="correctOption" name="correctOption" defaultValue={defaults?.correctOption ?? "A"}>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>

      <label htmlFor="marks">Marks</label>
      <input id="marks" name="marks" type="number" step="0.5" defaultValue={defaults?.marks ?? 2} required />

      <label htmlFor="negativeMarks">Negative marks</label>
      <input
        id="negativeMarks"
        name="negativeMarks"
        type="number"
        step="0.05"
        defaultValue={defaults?.negativeMarks ?? 0.5}
        required
      />

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : defaults?.questionId ? "Save changes" : "Add question"}
      </button>
    </form>
  );
}
