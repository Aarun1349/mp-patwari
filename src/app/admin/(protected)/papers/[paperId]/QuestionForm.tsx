"use client";

import { useActionState } from "react";
import type { QuestionActionState } from "@/app/actions/adminPapers";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="ee-form-grid">
      <input type="hidden" name="paperId" value={paperId} />
      {defaults?.questionId && <input type="hidden" name="questionId" value={defaults.questionId} />}

      <Field label="Section" htmlFor="sectionId" className="ee-span-2">
        <Select id="sectionId" name="sectionId" defaultValue={defaults?.sectionId}>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameEn}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Question text" htmlFor="text" className="ee-span-2">
        <Textarea id="text" name="text" rows={3} defaultValue={defaults?.text} required />
      </Field>

      <Field label="Option A" htmlFor="optionA">
        <Input id="optionA" name="optionA" type="text" defaultValue={defaults?.optionA} required />
      </Field>
      <Field label="Option B" htmlFor="optionB">
        <Input id="optionB" name="optionB" type="text" defaultValue={defaults?.optionB} required />
      </Field>
      <Field label="Option C" htmlFor="optionC">
        <Input id="optionC" name="optionC" type="text" defaultValue={defaults?.optionC} required />
      </Field>
      <Field label="Option D" htmlFor="optionD">
        <Input id="optionD" name="optionD" type="text" defaultValue={defaults?.optionD} required />
      </Field>

      <Field
        label="Correct option"
        htmlFor="correctOption"
        hint="Marks & negative marking are inherited from the paper — not set per question."
        className="ee-span-2"
      >
        <Select id="correctOption" name="correctOption" defaultValue={defaults?.correctOption ?? "A"}>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </Select>
      </Field>

      {state?.error && (
        <div className="ee-span-2">
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}

      <div className="ee-span-2">
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          {pending ? "Saving…" : defaults?.questionId ? "Save changes" : "Add question"}
        </Button>
      </div>
    </form>
  );
}
