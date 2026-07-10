"use client";

import { useActionState } from "react";
import {
  generateQuestionsAction,
  saveGeneratedQuestionsAction,
  type GenerateState,
} from "@/app/actions/adminAiQuestions";

export function AiGenerateForm({
  paperId,
  sections,
}: {
  paperId: string;
  sections: { id: string; nameEn: string }[];
}) {
  const [genState, genAction, genPending] = useActionState<GenerateState, FormData>(
    generateQuestionsAction,
    undefined
  );
  const [saveState, saveAction, savePending] = useActionState(saveGeneratedQuestionsAction, undefined);

  const questions = genState && "questions" in genState ? genState.questions : null;

  return (
    <div>
      <form action={genAction} className="auth-form">
        <input type="hidden" name="paperId" value={paperId} />

        <label htmlFor="sectionId">Section</label>
        <select id="sectionId" name="sectionId" required>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameEn}
            </option>
          ))}
        </select>

        <label htmlFor="count">How many questions</label>
        <input id="count" name="count" type="number" min={1} max={15} defaultValue={5} required />

        <label htmlFor="topicHint">Topic hint (optional)</label>
        <input id="topicHint" name="topicHint" type="text" placeholder="e.g. Indian Constitution, percentages" />

        {genState && "error" in genState && <p className="auth-error">{genState.error}</p>}

        <button type="submit" disabled={genPending}>
          {genPending ? "Generating…" : "Generate with AI"}
        </button>
      </form>

      {questions && questions.length > 0 && (
        <form action={saveAction} className="auth-form" style={{ marginTop: "24px" }}>
          <input type="hidden" name="paperId" value={genState && "paperId" in genState ? genState.paperId : ""} />
          <input type="hidden" name="sectionId" value={genState && "sectionId" in genState ? genState.sectionId : ""} />
          <input type="hidden" name="count" value={questions.length} />

          <h2 style={{ marginTop: "8px" }}>Review before saving</h2>
          <p className="muted">
            Uncheck any question you don&apos;t want, edit text/options as needed, then save. Nothing is added
            to the paper until you save here.
          </p>

          {questions.map((q, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgba(26,42,68,0.2)",
                borderRadius: "6px",
                padding: "14px",
                marginTop: "14px",
              }}
            >
              <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: 0 }}>
                <input type="checkbox" name={`q_${i}_include`} defaultChecked /> Include this question
              </label>

              <label htmlFor={`q_${i}_text`}>Question text</label>
              <textarea id={`q_${i}_text`} name={`q_${i}_text`} rows={2} defaultValue={q.text} />

              {q.options.map((opt, j) => (
                <div key={j}>
                  <label htmlFor={`q_${i}_option_${j}`}>
                    Option {["A", "B", "C", "D"][j]}
                    {j === q.correctIndex ? " (AI marked this correct)" : ""}
                  </label>
                  <input id={`q_${i}_option_${j}`} name={`q_${i}_option_${j}`} type="text" defaultValue={opt} />
                </div>
              ))}

              <label htmlFor={`q_${i}_correctIndex`}>Correct option</label>
              <select id={`q_${i}_correctIndex`} name={`q_${i}_correctIndex`} defaultValue={q.correctIndex}>
                <option value={0}>A</option>
                <option value={1}>B</option>
                <option value={2}>C</option>
                <option value={3}>D</option>
              </select>
            </div>
          ))}

          {saveState?.error && <p className="auth-error">{saveState.error}</p>}

          <button type="submit" disabled={savePending} style={{ marginTop: "18px" }}>
            {savePending ? "Saving…" : "Save selected questions to paper"}
          </button>
        </form>
      )}
    </div>
  );
}
