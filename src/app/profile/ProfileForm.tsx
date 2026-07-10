"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  OBC: "OBC",
  SC: "SC",
  ST: "ST",
  EWS: "EWS",
};

const QUALIFICATION_LABELS: Record<string, string> = {
  TENTH: "10th pass",
  TWELFTH: "12th pass",
  GRADUATE: "Graduate",
  POST_GRADUATE: "Post-graduate",
  OTHER: "Other",
};

export function ProfileForm({
  name,
  email,
  dateOfBirth,
  city,
  category,
  qualification,
  examInterest,
  contactPhone,
}: {
  name: string;
  email: string;
  dateOfBirth: string;
  city: string;
  category: string;
  qualification: string;
  examInterest: string;
  contactPhone: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="name">Name</label>
      <input id="name" name="name" type="text" defaultValue={name} required maxLength={100} />

      <label htmlFor="email">Email (optional)</label>
      <input id="email" name="email" type="email" defaultValue={email} />

      <label htmlFor="contactPhone">Contact mobile number (optional)</label>
      <input
        id="contactPhone"
        name="contactPhone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile number"
        defaultValue={contactPhone}
      />

      <label htmlFor="dateOfBirth">Date of birth (optional)</label>
      <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={dateOfBirth} />

      <label htmlFor="city">City / District (optional)</label>
      <input id="city" name="city" type="text" maxLength={100} defaultValue={city} />

      <label htmlFor="category">Category (optional)</label>
      <select id="category" name="category" defaultValue={category}>
        <option value="">Prefer not to say</option>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor="qualification">Highest qualification (optional)</label>
      <select id="qualification" name="qualification" defaultValue={qualification}>
        <option value="">Prefer not to say</option>
        {Object.entries(QUALIFICATION_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor="examInterest">Exam you're preparing for (optional)</label>
      <input
        id="examInterest"
        name="examInterest"
        type="text"
        maxLength={150}
        placeholder="e.g. MP Patwari"
        defaultValue={examInterest}
      />

      {state?.error && <p className="auth-error">{state.error}</p>}
      {state?.success && <p className="auth-success">Profile updated.</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
