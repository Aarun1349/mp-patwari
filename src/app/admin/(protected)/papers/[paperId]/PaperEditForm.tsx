"use client";

import { useActionState } from "react";
import { updatePaperAction } from "@/app/actions/adminPapers";
import { Field, Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
    <form action={action} className="ee-form-grid">
      <input type="hidden" name="id" value={paper.id} />

      <Field label="Title" htmlFor="title" className="ee-span-2">
        <Input id="title" name="title" type="text" defaultValue={paper.title} required />
      </Field>

      <Field label="Duration (minutes)" htmlFor="durationMinutes" hint="Max 180 minutes">
        <Input id="durationMinutes" name="durationMinutes" type="number" min={1} max={180} defaultValue={paper.durationMinutes} required />
      </Field>

      <Field label="Total questions" htmlFor="totalQuestions" hint="Label only (actual count = active rows below) · max 300">
        <Input id="totalQuestions" name="totalQuestions" type="number" min={1} max={300} defaultValue={paper.totalQuestions} required />
      </Field>

      <Field label="Total marks" htmlFor="totalMarks">
        <Input id="totalMarks" name="totalMarks" type="number" min={1} defaultValue={paper.totalMarks} required />
      </Field>

      <Field label="Negative marking ratio" htmlFor="negativeMarkingRatio" hint="0 – 0.50">
        <Input id="negativeMarkingRatio" name="negativeMarkingRatio" type="number" step="0.01" min={0} max={0.5} defaultValue={paper.negativeMarkingRatio} required />
      </Field>

      <div className="ee-span-2" style={{ paddingTop: "4px" }}>
        <Checkbox name="isFree" defaultChecked={paper.isFree} label="Free paper (no credit needed to attempt)" />
      </div>

      {state?.error && (
        <div className="ee-span-2">
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}

      <div className="ee-span-2">
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
