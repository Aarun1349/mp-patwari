export type ExamStatus = "in_progress" | "paused" | "locked" | "submitted" | "expired";

export interface QuestionPayload {
  index: number;
  total: number;
  questionId: string;
  section: { code: string; nameEn: string; nameHi: string };
  text: string;
  options: { id: string; label: string; text: string }[];
  translatable: boolean;
  selectedOptionId: string | null;
  markedForReview: boolean;
}

export type DisplayLang = "original" | "alt";

/** The language-dependent parts of a question — cached per (index, lang) so
 * toggling the display language is instant instead of a server round-trip. */
export interface LangVariant {
  text: string;
  options: QuestionPayload["options"];
}

export interface AnsweredEntry {
  selectedOptionId: string | null;
  markedForReview: boolean;
}

export interface ExamState {
  status: ExamStatus;
  currentIndex: number;
  totalQuestions: number;
  currentQuestion: QuestionPayload | null;
  loadingQuestion: boolean;
  translating: boolean;
  answered: Record<number, AnsweredEntry>;
  langCache: Record<string, LangVariant>;
  remainingSeconds: number;
  fullscreenExitCount: number;
  fullscreenUnsupported: boolean;
  error: string | null;
  displayLang: DisplayLang;
}

export type ExamAction =
  | { type: "QUESTION_LOADING" }
  | { type: "QUESTION_LOADED"; payload: QuestionPayload; lang: DisplayLang }
  | { type: "ANSWER_RECORDED"; index: number; selectedOptionId: string | null; markedForReview: boolean }
  | { type: "HEARTBEAT"; status: ExamStatus; remainingSeconds: number; fullscreenExitCount?: number }
  | { type: "TICK" }
  | { type: "VIOLATION"; status: ExamStatus; fullscreenExitCount: number }
  | { type: "RESUMED" }
  | { type: "FULLSCREEN_UNSUPPORTED" }
  | { type: "TRANSLATING"; on: boolean }
  | { type: "CACHE_LANG"; key: string; variant: LangVariant }
  | { type: "SET_LANG_VARIANT"; lang: DisplayLang; variant: LangVariant }
  | { type: "ERROR"; message: string };

export function langKey(index: number, lang: DisplayLang): string {
  return `${index}:${lang}`;
}

export function createInitialState(totalQuestions: number, remainingSeconds: number): ExamState {
  return {
    status: "in_progress",
    currentIndex: 0,
    totalQuestions,
    currentQuestion: null,
    loadingQuestion: false,
    translating: false,
    answered: {},
    langCache: {},
    remainingSeconds,
    fullscreenExitCount: 0,
    fullscreenUnsupported: false,
    error: null,
    displayLang: "original",
  };
}

export function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "QUESTION_LOADING":
      return { ...state, loadingQuestion: true, error: null };

    case "QUESTION_LOADED":
      return {
        ...state,
        loadingQuestion: false,
        translating: false,
        displayLang: action.lang,
        currentIndex: action.payload.index,
        currentQuestion: action.payload,
        answered: {
          ...state.answered,
          [action.payload.index]: {
            selectedOptionId: action.payload.selectedOptionId,
            markedForReview: action.payload.markedForReview,
          },
        },
        // Cache the language variant we just loaded so toggling back is instant.
        langCache: {
          ...state.langCache,
          [langKey(action.payload.index, action.lang)]: {
            text: action.payload.text,
            options: action.payload.options,
          },
        },
      };

    case "ANSWER_RECORDED":
      return {
        ...state,
        answered: {
          ...state.answered,
          [action.index]: {
            selectedOptionId: action.selectedOptionId,
            markedForReview: action.markedForReview,
          },
        },
        // currentQuestion is a separate piece of state from `answered` (which
        // only drives the palette) — without this, the radio/checkbox inputs
        // never visually reflect the selection since QuestionPanel reads
        // currentQuestion.selectedOptionId, not the answered map.
        currentQuestion:
          state.currentQuestion && state.currentQuestion.index === action.index
            ? {
                ...state.currentQuestion,
                selectedOptionId: action.selectedOptionId,
                markedForReview: action.markedForReview,
              }
            : state.currentQuestion,
      };

    case "HEARTBEAT":
      return {
        ...state,
        status: action.status,
        remainingSeconds: action.remainingSeconds,
        fullscreenExitCount: action.fullscreenExitCount ?? state.fullscreenExitCount,
      };

    case "TICK":
      return state.status === "in_progress"
        ? { ...state, remainingSeconds: Math.max(0, state.remainingSeconds - 1) }
        : state;

    case "VIOLATION":
      return { ...state, status: action.status, fullscreenExitCount: action.fullscreenExitCount };

    case "RESUMED":
      return { ...state, status: "in_progress" };

    case "FULLSCREEN_UNSUPPORTED":
      return { ...state, fullscreenUnsupported: true };

    case "TRANSLATING":
      return { ...state, translating: action.on };

    case "CACHE_LANG":
      return { ...state, langCache: { ...state.langCache, [action.key]: action.variant } };

    case "SET_LANG_VARIANT":
      // Swap only the rendered text/options; preserve the user's current
      // selection and index (the variant carries no answer state).
      return {
        ...state,
        displayLang: action.lang,
        translating: false,
        currentQuestion: state.currentQuestion
          ? { ...state.currentQuestion, text: action.variant.text, options: action.variant.options }
          : state.currentQuestion,
      };

    case "ERROR":
      return { ...state, loadingQuestion: false, translating: false, error: action.message };

    default:
      return state;
  }
}
