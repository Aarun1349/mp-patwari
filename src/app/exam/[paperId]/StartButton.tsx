"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startAttemptAction } from "@/app/actions/exam";

export function StartButton({ paperId }: { paperId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      // Fullscreen must be requested synchronously-ish within the click
      // gesture. If unsupported (e.g. iOS Safari) or rejected, degrade
      // gracefully rather than blocking the user from taking the exam.
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        // ignored — exam proceeds without fullscreen
      }

      const result = await startAttemptAction(paperId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.replace(`/exam/attempt/${result.attemptId}`);
    });
  }

  return (
    <div className="auth-form">
      {error && <p className="auth-error">{error}</p>}
      <button type="button" onClick={handleStart} disabled={pending}>
        {pending ? "Starting…" : "Start Exam"}
      </button>
    </div>
  );
}
