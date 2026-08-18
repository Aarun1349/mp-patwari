"use client";

import { useActionState } from "react";
import type { PackageActionState } from "@/app/actions/adminPackages";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function PackageForm({
  action,
  defaults,
  exams,
}: {
  action: (state: PackageActionState, formData: FormData) => Promise<PackageActionState>;
  defaults?: {
    id?: string;
    name: string;
    testCount: number;
    pricePaise: number;
    kind: "standard" | "topup";
    validityDays: number;
    sortOrder: number;
    isActive: boolean;
  };
  exams?: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="ee-form-grid">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {exams && (
        <Field label="Exam" htmlFor="examId" className="ee-span-2">
          <Select id="examId" name="examId" required defaultValue={exams[0]?.id}>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Name" htmlFor="name" className="ee-span-2">
        <Input id="name" name="name" type="text" defaultValue={defaults?.name} placeholder="e.g. Starter Pack" required />
      </Field>

      <Field label="Test count" htmlFor="testCount">
        <Input id="testCount" name="testCount" type="number" min={1} defaultValue={defaults?.testCount ?? 5} required />
      </Field>

      <Field label="Price (₹)" htmlFor="priceRupees">
        <Input
          id="priceRupees"
          name="priceRupees"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 399"
          defaultValue={defaults ? defaults.pricePaise / 100 : ""}
          required
        />
      </Field>

      <Field label="Kind" htmlFor="kind">
        <Select id="kind" name="kind" defaultValue={defaults?.kind ?? "standard"}>
          <option value="standard">Standard</option>
          <option value="topup">Top-up (existing customers only)</option>
        </Select>
      </Field>

      <Field label="Validity (days)" htmlFor="validityDays">
        <Input id="validityDays" name="validityDays" type="number" min={1} defaultValue={defaults?.validityDays ?? 60} required />
      </Field>

      <Field label="Sort order" htmlFor="sortOrder" hint="Lower shows first">
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={defaults?.sortOrder ?? 0} required />
      </Field>

      <div className="ee-field" style={{ alignSelf: "end", paddingBottom: "11px" }}>
        <Checkbox name="isActive" defaultChecked={defaults?.isActive ?? true} label="Active (visible to students)" />
      </div>

      {state?.error && (
        <div className="ee-span-2">
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}

      <div className="ee-span-2">
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          {pending ? "Saving…" : defaults?.id ? "Save changes" : "Create package"}
        </Button>
      </div>
    </form>
  );
}
