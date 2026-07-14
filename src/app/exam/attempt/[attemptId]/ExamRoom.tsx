"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { createInitialState, examReducer, langKey, type DisplayLang, type QuestionPayload } from "./examReducer";
import { QuestionPanel } from "./QuestionPanel";
import { Palette, type PaletteSection } from "./Palette";
import { TimerBar } from "./TimerBar";
import { ViolationModal } from "./ViolationModal";

const HEARTBEAT_INTERVAL_MS = 15_000;
const VIOLATION_DEBOUNCE_MS = 1_000;

/** One question from the bulk /paper load — carries both languages. */
interface PaperItem {
  index: number;
  questionId: string;
  section: { code: string; nameEn: string; nameHi: string };
  translatable: boolean;
  text: string;
  textAlt: string | null;
  options: { id: string; label: string; text: string; textAlt: string | null }[];
  selectedOptionId: string | null;
  markedForReview: boolean;
}

/** The alt language is only usable if the question AND all its options are translated. */
function altAvailable(item: PaperItem): boolean {
  return item.textAlt != null && item.options.every((o) => o.textAlt != null);
}

/** Build the client QuestionPayload for a given language from a preloaded item. */
function buildPayload(item: PaperItem, lang: DisplayLang, total: number): QuestionPayload {
  const useAlt = lang === "alt";
  return {
    index: item.index,
    total,
    questionId: item.questionId,
    section: item.section,
    text: useAlt && item.textAlt != null ? item.textAlt : item.text,
    options: item.options.map((o) => ({
      id: o.id,
      label: o.label,
      text: useAlt && o.textAlt != null ? o.textAlt : o.text,
    })),
    translatable: item.translatable,
    selectedOptionId: item.selectedOptionId,
    markedForReview: item.markedForReview,
  };
}

export function ExamRoom({
  attemptId,
  paperTitle,
  totalQuestions,
  initialRemainingSeconds,
  sections,
}: {
  attemptId: string;
  paperTitle: string;
  totalQuestions: number;
  initialRemainingSeconds: number;
  sections: PaletteSection[];
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    examReducer,
    createInitialState(totalQuestions, initialRemainingSeconds)
  );
  const lastViolationAt = useRef(0);
  // Whole-paper preload cache, keyed `${index}:${lang}` — populated once on
  // mount from /paper so navigation and language toggles never hit the network.
  const preloadRef = useRef<Map<string, QuestionPayload>>(new Map());

  // Raw fetch of one question variant — served instantly from the preload cache
  // when present, otherwise a network request. `report` controls whether
  // transport errors surface in the UI (background prefetches pass false).
  const fetchQuestion = useCallback(
    async (index: number, lang: DisplayLang, report = true): Promise<QuestionPayload | null> => {
      const cached = preloadRef.current.get(`${index}:${lang}`);
      if (cached) return cached;
      try {
        const res = await fetch(`/api/exam/${attemptId}/question/${index}?lang=${lang === "alt" ? "alt" : "original"}`);
        if (res.status === 409) {
          const body = await res.json();
          dispatch({ type: "HEARTBEAT", status: body.status, remainingSeconds: 0 });
          return null;
        }
        if (!res.ok) {
          if (report) dispatch({ type: "ERROR", message: "Could not load question." });
          return null;
        }
        return (await res.json()) as QuestionPayload;
      } catch {
        if (report) dispatch({ type: "ERROR", message: "Network error loading question." });
        return null;
      }
    },
    [attemptId]
  );

  const loadQuestion = useCallback(
    async (index: number, lang: DisplayLang = state.displayLang) => {
      dispatch({ type: "QUESTION_LOADING" });
      const payload = await fetchQuestion(index, lang);
      if (!payload) return;
      dispatch({ type: "QUESTION_LOADED", payload, lang });

      // Warm the other language in the background so the toggle is instant.
      if (payload.translatable) {
        const other: DisplayLang = lang === "original" ? "alt" : "original";
        const key = langKey(index, other);
        void (async () => {
          const alt = await fetchQuestion(index, other, false);
          if (alt) dispatch({ type: "CACHE_LANG", key, variant: { text: alt.text, options: alt.options } });
        })();
      }
    },
    [fetchQuestion, state.displayLang]
  );

  async function toggleLang() {
    if (!state.currentQuestion || state.translating) return;
    const next: DisplayLang = state.displayLang === "original" ? "alt" : "original";
    const key = langKey(state.currentIndex, next);

    // Instant path: variant already cached (initial load, prefetch, or a prior
    // toggle) — swap client-side with no server round-trip.
    const cached = state.langCache[key];
    if (cached) {
      dispatch({ type: "SET_LANG_VARIANT", lang: next, variant: cached });
      return;
    }

    // First time for this variant (may involve a one-off server-side
    // translation); fetch once, then it's cached for the rest of the exam.
    dispatch({ type: "TRANSLATING", on: true });
    const payload = await fetchQuestion(state.currentIndex, next);
    if (payload) {
      const variant = { text: payload.text, options: payload.options };
      dispatch({ type: "CACHE_LANG", key, variant });
      dispatch({ type: "SET_LANG_VARIANT", lang: next, variant });
    } else {
      dispatch({ type: "TRANSLATING", on: false });
    }
  }

  // "Save & Next"-style advance: walk within the current section, and when the
  // section is finished jump to the next section's first unanswered question.
  const goNext = useCallback(() => {
    const idx = state.currentIndex;
    const secOrder = sections.findIndex((s) => s.indices.includes(idx));
    const section = sections[secOrder];
    if (!section) {
      if (idx < totalQuestions - 1) loadQuestion(idx + 1);
      return;
    }
    const pos = section.indices.indexOf(idx);
    if (pos < section.indices.length - 1) {
      loadQuestion(section.indices[pos + 1]);
      return;
    }
    const nextSection = sections[secOrder + 1];
    if (nextSection) {
      const target =
        nextSection.indices.find((i) => !state.answered[i]?.selectedOptionId) ?? nextSection.indices[0];
      loadQuestion(target);
    }
  }, [state.currentIndex, state.answered, sections, totalQuestions, loadQuestion]);

  // Whether a "next" target exists — false only on the last question of the
  // last section.
  const currentSectionOrder = sections.findIndex((s) => s.indices.includes(state.currentIndex));
  const currentSection = sections[currentSectionOrder];
  const isLastInSection =
    !!currentSection && currentSection.indices[currentSection.indices.length - 1] === state.currentIndex;
  const isLastSection = currentSectionOrder === sections.length - 1;
  const hasNext = !(isLastInSection && isLastSection);

  // Preload the whole paper once (both languages + saved answers), then show Q1
  // from cache. Falls back to per-question fetching if the bulk load fails, so
  // the exam always starts even if /paper errors.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/exam/${attemptId}/paper`);
        if (res.status === 409) {
          const body = await res.json();
          if (!cancelled) dispatch({ type: "HEARTBEAT", status: body.status, remainingSeconds: 0 });
          return;
        }
        if (res.ok) {
          const data: { total: number; questions: PaperItem[] } = await res.json();
          if (!cancelled) {
            for (const item of data.questions) {
              preloadRef.current.set(`${item.index}:original`, buildPayload(item, "original", totalQuestions));
              if (altAvailable(item)) {
                preloadRef.current.set(`${item.index}:alt`, buildPayload(item, "alt", totalQuestions));
              }
            }
          }
        }
      } catch {
        // fall through to per-question loading
      }
      if (!cancelled) loadQuestion(0);
    })();
    return () => {
      cancelled = true;
    };
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
    // Keep the preload cache in sync so navigating back shows this selection.
    for (const lang of ["original", "alt"] as const) {
      const key = `${index}:${lang}`;
      const cached = preloadRef.current.get(key);
      if (cached) preloadRef.current.set(key, { ...cached, selectedOptionId, markedForReview });
    }
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

  function clearResponse() {
    if (!state.currentQuestion) return;
    saveAnswer(null, state.currentQuestion.markedForReview);
  }

  async function handleSubmit() {
    if (!window.confirm("Submit the exam? You will not be able to change any answers after this.")) return;
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

  const canTranslate = state.currentQuestion?.translatable ?? false;

  return (
    <main className="exam-room-main" style={{ display: "flex", flexDirection: "column", background: "#ffffff", userSelect: "none" }}>
      {state.status === "paused" && (
        <ViolationModal fullscreenExitCount={state.fullscreenExitCount} onResume={handleResume} />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: "8px",
          flexShrink: 0,
          background: "#1a2a44",
          borderBottom: "3px solid #c9a227",
          padding: "14px 28px",
        }}
      >
        <h1 style={{ fontSize: "16px", color: "#f0e9d8", fontWeight: 700, margin: 0 }}>{paperTitle}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <button
            type="button"
            onClick={toggleLang}
            disabled={!canTranslate || state.translating}
            title={canTranslate ? "Switch question language" : "Not available for this section"}
            style={{
              background: "transparent",
              border: "1px solid rgba(240,233,216,0.4)",
              color: canTranslate ? "#f0e9d8" : "rgba(240,233,216,0.35)",
              padding: "6px 12px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: canTranslate && !state.translating ? "pointer" : "default",
            }}
          >
            {state.translating
              ? "Translating…"
              : state.displayLang === "original"
                ? "हिंदी / English"
                : "English / हिंदी"}
          </button>
          <TimerBar remainingSeconds={state.remainingSeconds} />
        </div>
      </div>

      <div className="exam-room-content" style={{ padding: "20px 32px", display: "flex", flexDirection: "column" }}>
        {state.error && <p className="auth-error">{state.error}</p>}

        <div className="exam-room-grid">
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(26,42,68,0.15)",
              borderRadius: "6px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(26,42,68,0.08)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <div style={{ flex: 1 }}>
              {state.currentQuestion && !state.loadingQuestion ? (
                <QuestionPanel
                  question={state.currentQuestion}
                  onSelect={(optionId) => saveAnswer(optionId, state.currentQuestion!.markedForReview)}
                  onToggleReview={(marked) => saveAnswer(state.currentQuestion!.selectedOptionId, marked)}
                />
              ) : (
                <p style={{ color: "#5c5c5c", fontSize: "14px" }}>Loading question…</p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginTop: "auto",
                paddingTop: "18px",
                borderTop: "1px solid rgba(26,42,68,0.12)",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={state.currentIndex === 0}
                onClick={() => loadQuestion(state.currentIndex - 1)}
              >
                Previous
              </button>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={clearResponse} disabled={!state.currentQuestion?.selectedOptionId}>
                  Clear Response
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveAnswer(state.currentQuestion!.selectedOptionId, true);
                    if (hasNext) goNext();
                  }}
                  disabled={!state.currentQuestion}
                  style={{ background: "#c9a227", color: "#101a2c", borderColor: "#c9a227", fontWeight: 700 }}
                >
                  Mark for Review &amp; Next
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hasNext) goNext();
                  }}
                  disabled={!state.currentQuestion || !hasNext}
                  style={{ background: "#2a7a2a", color: "#fff", borderColor: "#2a7a2a", fontWeight: 700 }}
                >
                  Save &amp; Next
                </button>
              </div>
            </div>
          </div>

          <div
            className="exam-room-sidebar"
            style={{
              background: "#fff",
              border: "1px solid rgba(26,42,68,0.15)",
              borderRadius: "6px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(26,42,68,0.08)",
            }}
          >
            <Palette
              sections={sections}
              currentIndex={state.currentIndex}
              answered={state.answered}
              onJump={loadQuestion}
            />

            <button
              type="button"
              onClick={handleSubmit}
              style={{
                width: "100%",
                marginTop: "18px",
                background: "#a3242a",
                color: "#fff",
                border: "none",
                borderRadius: "3px",
                padding: "12px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Finish &amp; Submit Exam
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
