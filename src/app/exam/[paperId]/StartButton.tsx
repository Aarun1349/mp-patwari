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

    // Request fullscreen SYNCHRONOUSLY inside the click gesture. The Fullscreen
    // API requires transient user activation, which is lost the moment we await
    // anything (or defer into startTransition) — so this must run first, before
    // any async work. Fire-and-forget: never await or block on it. Some
    // environments reject or ignore fullscreen (backgrounded tab, iOS Safari,
    // permissions policy), and the exam must still start regardless — tab-switch
    // and visibility violations are enforced by ExamRoom independent of
    // fullscreen.
    try {
      const fs = document.documentElement.requestFullscreen?.();
      if (fs && typeof fs.catch === "function") fs.catch(() => {});
    } catch {
      // ignored — exam proceeds without fullscreen
    }

    startTransition(async () => {
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
