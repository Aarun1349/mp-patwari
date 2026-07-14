"use client";

import { useActionState, useMemo, useState } from "react";
import { uploadQuestionsAction } from "@/app/actions/contentUpload";

interface UploadPaper {
  id: string;
  title: string;
  isFree: boolean;
  examId: string;
}

export function UploadForm({
  exams,
  papers,
}: {
  exams: { id: string; name: string }[];
  papers: UploadPaper[];
}) {
  const [state, action, pending] = useActionState(uploadQuestionsAction, undefined);
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const examPapers = useMemo(() => papers.filter((p) => p.examId === examId), [papers, examId]);
  const [paperMode, setPaperMode] = useState<"existing" | "new">("new");

  const canUseExisting = examPapers.length > 0;
  const effectiveMode = paperMode === "existing" && !canUseExisting ? "new" : paperMode;

  return (
    <form action={action} className="auth-form">
      <label htmlFor="examId">Exam</label>
      <select id="examId" name="examId" value={examId} onChange={(e) => setExamId(e.target.value)}>
        {exams.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      <a
        href={`/admin/upload/sample?examId=${examId}`}
        className="btn btn-secondary btn-sm"
        style={{ alignSelf: "flex-start", margin: "2px 0 8px" }}
      >
        ⭳ Download sample sheet (for this exam)
      </a>

      <label style={{ opacity: canUseExisting ? 1 : 0.5 }}>
        <input
          type="radio"
          name="paperMode"
          value="existing"
          checked={effectiveMode === "existing"}
          onChange={() => setPaperMode("existing")}
          disabled={!canUseExisting}
        />{" "}
        Add to existing paper {canUseExisting ? "" : "(none for this exam yet)"}
      </label>
      {effectiveMode === "existing" && (
        <select name="existingPaperId" defaultValue={examPapers[0]?.id}>
          {examPapers.map((p) => (
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
          checked={effectiveMode === "new"}
          onChange={() => setPaperMode("new")}
        />{" "}
        Create new paper
      </label>
      {effectiveMode === "new" && (
        <>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" placeholder="e.g. MP Constable Mock Test 01" required />

          <label>
            <input type="checkbox" name="isFree" /> Free paper
          </label>

          <label htmlFor="durationMinutes">Duration (minutes)</label>
          <input id="durationMinutes" name="durationMinutes" type="number" defaultValue={180} required />

          <label htmlFor="totalQuestions">Total questions</label>
          <input id="totalQuestions" name="totalQuestions" type="number" defaultValue={100} required />

          <label htmlFor="totalMarks">Total marks</label>
          <input id="totalMarks" name="totalMarks" type="number" defaultValue={200} required />

          <label htmlFor="negativeMarkingRatio">Negative marking ratio (e.g. 0.25)</label>
          <input id="negativeMarkingRatio" name="negativeMarkingRatio" type="number" step="0.01" defaultValue={0.25} required />
        </>
      )}

      <label htmlFor="file">Spreadsheet (.xlsx/.csv)</label>
      <input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />

      {state && "error" in state && <p className="auth-error">{state.error}</p>}

      {state && "success" in state && (
        <div className="upload-report">
          <div className="upload-report-summary">
            <span className="ur-pill ok">✓ {state.successCount} uploaded</span>
            {state.errorCount > 0 && <span className="ur-pill fail">✕ {state.errorCount} failed</span>}
            <span className="ur-note">
              of {state.rowCount} rows → {state.paperTitle}
            </span>
          </div>
          {state.errors.length > 0 && (
            <div style={{ overflowX: "auto", marginTop: "10px" }}>
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{ width: "70px" }}>Row</th>
                    <th>Why it failed</th>
                  </tr>
                </thead>
                <tbody>
                  {state.errors.map((e) => (
                    <tr key={e.row}>
                      <td className="mono">{e.row}</td>
                      <td style={{ color: "#b3261e" }}>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ur-note" style={{ marginTop: "8px" }}>
                Fix these rows in your sheet and re-upload — the {state.successCount} valid rows are already saved.
              </p>
            </div>
          )}
        </div>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
