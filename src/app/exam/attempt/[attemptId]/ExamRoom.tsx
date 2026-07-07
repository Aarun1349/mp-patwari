"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { createInitialState, examReducer, type QuestionPayload } from "./examReducer";
import { QuestionPanel } from "./QuestionPanel";
import { Palette } from "./Palette";
import { TimerBar } from "./TimerBar";
import { ViolationModal } from "./ViolationModal";

const HEARTBEAT_INTERVAL_MS = 15_000;
const VIOLATION_DEBOUNCE_MS = 1_000;

export function ExamRoom({
  attemptId,
  paperTitle,
  totalQuestions,
  initialRemainingSeconds,
}: {
  attemptId: string;
  paperTitle: string;
  totalQuestions: number;
  initialRemainingSeconds: number;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    examReducer,
    createInitialState(totalQuestions, initialRemainingSeconds)
  );
  const lastViolationAt = useRef(0);

  const loadQuestion = useCallback(
    async (index: number) => {
      dispatch({ type: "QUESTION_LOADING" });
      try {
        const res = await fetch(`/api/exam/${attemptId}/question/${index}`);
        if (res.status === 409) {
          const body = await res.json();
          dispatch({ type: "HEARTBEAT", status: body.status, remainingSeconds: 0 });
          return;
        }
        if (!res.ok) {
          dispatch({ type: "ERROR", message: "Could not load question." });
          return;
        }
        const payload: QuestionPayload = await res.json();
        dispatch({ type: "QUESTION_LOADED", payload });
      } catch {
        dispatch({ type: "ERROR", message: "Network error loading question." });
      }
    },
    [attemptId]
  );

  // Initial question load.
  useEffect(() => {
    loadQuestion(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat: immediate + interval. Server is the only authority on remaining time.
  useEffect(() => {
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/heartbeat`);
        const body = await res.json();
        if (!cancelled) {
          dispatch({
            type: "HEARTBEAT",
            status: body.status,
            remainingSeconds: body.remainingSeconds,
            fullscreenExitCount: body.fullscreenExitCount,
          });
        }
      } catch {
        // transient network error — next heartbeat will retry
      }
    }

    beat();
    const handle = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [attemptId]);

  // Local 1s cosmetic tick between heartbeats.
  useEffect(() => {
    const handle = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(handle);
  }, []);

  // Redirect once the attempt reaches a terminal state.
  useEffect(() => {
    if (["submitted", "expired", "locked"].includes(state.status)) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      router.replace(`/exam/result/${attemptId}`);
    }
  }, [state.status, attemptId, router]);

  const reportViolation = useCallback(
    async (type: string) => {
      const now = Date.now();
      if (now - lastViolationAt.current < VIOLATION_DEBOUNCE_MS) return;
      lastViolationAt.current = now;

      try {
        const res = await fetch(`/api/exam/${attemptId}/violation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const body = await res.json();
        if (body.status) {
          dispatch({ type: "VIOLATION", status: body.status, fullscreenExitCount: body.fullscreenExitCount ?? 0 });
        }
      } catch {
        // if this fails, the reaper/heartbeat will still catch an abandoned attempt
      }
    },
    [attemptId]
  );

  // Fullscreen exit / tab-switch detection.
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) reportViolation("fullscreen_exit");
    }
    function onVisibilityChange() {
      if (document.hidden) reportViolation("visibility_hidden");
    }
    function onBlur() {
      reportViolation("tab_blur");
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [reportViolation]);

  // Disable right-click, text selection, copy/paste within the exam screen.
  useEffect(() => {
    function prevent(e: Event) {
      e.preventDefault();
    }
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
    };
  }, []);

  // Trap the browser back button.
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    function onPopState() {
      window.history.pushState(null, "", window.location.href);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Warn before leaving/closing the tab.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  async function saveAnswer(selectedOptionId: string | null, markedForReview: boolean) {
    if (!state.currentQuestion) return;
    const { questionId, index } = state.currentQuestion;
    dispatch({ type: "ANSWER_RECORDED", index, selectedOptionId, markedForReview });
    try {
      await fetch(`/api/exam/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOptionId, markedForReview }),
      });
    } catch {
      // best-effort; the next explicit navigation/save will retry the current value
    }
  }

  async function handleResume() {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // ignored — continue without fullscreen
    }
    const res = await fetch(`/api/exam/${attemptId}/resume`, { method: "POST" });
    if (res.ok) dispatch({ type: "RESUMED" });
  }

  async function handleSubmit() {
    await fetch(`/api/exam/${attemptId}/submit`, { method: "POST" });
    // The heartbeat/redirect effect will pick up the new terminal status shortly;
    // force an immediate check so the user isn't stuck waiting for the next tick.
    const res = await fetch(`/api/exam/${attemptId}/heartbeat`);
    const body = await res.json();
    dispatch({ type: "HEARTBEAT", status: body.status, remainingSeconds: 0 });
  }

  if (state.status === "locked") {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Attempt locked</h1>
          <p>This attempt was locked due to repeated violations and has been auto-submitted.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", userSelect: "none" }}>
      {state.status === "paused" && (
        <ViolationModal fullscreenExitCount={state.fullscreenExitCount} onResume={handleResume} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "18px" }}>{paperTitle}</h1>
        <TimerBar remainingSeconds={state.remainingSeconds} />
      </div>

      {state.error && <p className="auth-error">{state.error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginTop: "16px" }}>
        <div>
          {state.currentQuestion && !state.loadingQuestion ? (
            <QuestionPanel
              question={state.currentQuestion}
              onSelect={(optionId) => saveAnswer(optionId, state.currentQuestion!.markedForReview)}
              onToggleReview={(marked) => saveAnswer(state.currentQuestion!.selectedOptionId, marked)}
            />
          ) : (
            <p className="muted">Loading question…</p>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              type="button"
              disabled={state.currentIndex === 0}
              onClick={() => loadQuestion(state.currentIndex - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={state.currentIndex >= totalQuestions - 1}
              onClick={() => loadQuestion(state.currentIndex + 1)}
            >
              Next
            </button>
            <button type="button" className="auth-secondary" onClick={handleSubmit}>
              Submit Exam
            </button>
          </div>
        </div>

        <div>
          <Palette
            totalQuestions={totalQuestions}
            currentIndex={state.currentIndex}
            answered={state.answered}
            onJump={loadQuestion}
          />
        </div>
      </div>
    </main>
  );
}
