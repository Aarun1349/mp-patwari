"use client";

import { useActionState, useState } from "react";
import { uploadQuestionsAction } from "@/app/actions/contentUpload";

export function UploadForm({
  papers,
}: {
  papers: { id: string; title: string; isFree: boolean }[];
}) {
  const [state, action, pending] = useActionState(uploadQuestionsAction, undefined);
  const [paperMode, setPaperMode] = useState<"existing" | "new">(papers.length ? "existing" : "new");

  return (
    <form action={action} className="auth-form">
      <label>
        <input
          type="radio"
          name="paperMode"
          value="existing"
          checked={paperMode === "existing"}
          onChange={() => setPaperMode("existing")}
          disabled={papers.length === 0}
        />{" "}
        Add to existing paper
      </label>
      {paperMode === "existing" && (
        <select name="existingPaperId" defaultValue={papers[0]?.id}>
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} {p.isFree ? "(free)" : ""}
            </option>
          ))}
        </select>
      )}

      <label>
        <input
          type="radio"
          name="paperMode"
          value="new"
          checked={paperMode === "new"}
          onChange={() => setPaperMode("new")}
        />{" "}
        Create new paper
      </label>
      {paperMode === "new" && (
        <>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required />

          <label>
            <input type="checkbox" name="isFree" /> Free paper
          </label>

          <label htmlFor="durationMinutes">Duration (minutes)</label>
          <input id="durationMinutes" name="durationMinutes" type="number" defaultValue={180} required />

          <label htmlFor="totalQuestions">Total questions</label>
          <input id="totalQuestions" name="totalQuestions" type="number" defaultValue={100} required />

          <label htmlFor="totalMarks">Total marks</label>
          <input id="totalMarks" name="totalMarks" type="number" defaultValue={200} required />

          <label htmlFor="negativeMarkingRatio">Negative marking ratio (e.g. 0.33)</label>
          <input
            id="negativeMarkingRatio"
            name="negativeMarkingRatio"
            type="number"
            step="0.01"
            defaultValue={0.33}
            required
          />
        </>
      )}

      <label htmlFor="file">Spreadsheet (.xlsx/.csv)</label>
      <input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />

      {state && "error" in state && <p className="auth-error">{state.error}</p>}
      {state && "success" in state && (
        <p className="auth-success">
          Imported {state.successCount}/{state.rowCount} rows ({state.errorCount} errors) into paper{" "}
          {state.paperId}.
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
