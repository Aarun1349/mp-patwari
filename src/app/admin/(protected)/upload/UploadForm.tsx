"use client";

import { useActionState, useMemo, useState } from "react";
import { uploadQuestionsAction } from "@/app/actions/contentUpload";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label="Exam" htmlFor="examId">
        <Select id="examId" name="examId" value={examId} onChange={(e) => setExamId(e.target.value)}>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </Select>
      </Field>

      <ButtonLink
        href={`/admin/upload/sample?examId=${examId}`}
        variant="secondary"
        size="sm"
        style={{ alignSelf: "flex-start" }}
      >
        ⭳ Download sample sheet
      </ButtonLink>

      <div className="ee-field">
        <label>Target paper</label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <label className={`upload-mode-card${effectiveMode === "existing" ? " active" : ""}${!canUseExisting ? " disabled" : ""}`}>
            <input
              type="radio"
              name="paperMode"
              value="existing"
              checked={effectiveMode === "existing"}
              onChange={() => setPaperMode("existing")}
              disabled={!canUseExisting}
            />
            <span>Add to existing{!canUseExisting && <small> (none yet)</small>}</span>
          </label>
          <label className={`upload-mode-card${effectiveMode === "new" ? " active" : ""}`}>
            <input
              type="radio"
              name="paperMode"
              value="new"
              checked={effectiveMode === "new"}
              onChange={() => setPaperMode("new")}
            />
            <span>Create new paper</span>
          </label>
        </div>
      </div>

      {effectiveMode === "existing" && (
        <Field label="Existing paper" htmlFor="existingPaperId">
          <Select id="existingPaperId" name="existingPaperId" defaultValue={examPapers[0]?.id}>
            {examPapers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.isFree ? "(free)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {effectiveMode === "new" && (
        <>
          <Field label="Title" htmlFor="title">
            <Input id="title" name="title" type="text" placeholder="e.g. MP SI Prelims Mock 01" required />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Duration (minutes)" htmlFor="durationMinutes" hint="Max 180">
              <Input id="durationMinutes" name="durationMinutes" type="number" min={1} max={180} defaultValue={120} required />
            </Field>
            <Field label="Total questions" htmlFor="totalQuestions" hint="Max 300">
              <Input id="totalQuestions" name="totalQuestions" type="number" min={1} max={300} defaultValue={100} required />
            </Field>
            <Field label="Total marks" htmlFor="totalMarks">
              <Input id="totalMarks" name="totalMarks" type="number" defaultValue={100} required />
            </Field>
            <Field label="Negative marking ratio" hint="0 = no negative marking · max 0.50" htmlFor="negativeMarkingRatio">
              <Input id="negativeMarkingRatio" name="negativeMarkingRatio" type="number" step="0.01" min={0} max={0.5} defaultValue={0} required />
            </Field>
          </div>

          <Checkbox name="isFree" label="Free paper (no credit needed to attempt)" />
        </>
      )}

      <Field label="Spreadsheet (.xlsx / .csv)" htmlFor="file">
        <Input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />
      </Field>

      {state && "error" in state && <Alert variant="error">{state.error}</Alert>}

      {state && "success" in state && (
        <div className="ee-field">
          <Alert variant={state.errorCount > 0 ? "warning" : "success"}>
            <strong>✓ {state.successCount} uploaded</strong>
            {state.errorCount > 0 && <> · ✕ {state.errorCount} failed</>} — of {state.rowCount} rows → {state.paperTitle}
          </Alert>
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
                      <td style={{ color: "var(--color-error)" }}>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ee-hint" style={{ marginTop: "8px" }}>
                Fix these rows in your sheet and re-upload — the {state.successCount} valid rows are already saved.
              </p>
            </div>
          )}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" block loading={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
