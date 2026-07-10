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
  answered: Record<number, AnsweredEntry>;
  remainingSeconds: number;
  fullscreenExitCount: number;
  fullscreenUnsupported: boolean;
  error: string | null;
  displayLang: DisplayLang;
}

export type ExamAction =
  | { type: "QUESTION_LOADING" }
  | { type: "QUESTION_LOADED"; payload: QuestionPayload }
  | { type: "ANSWER_RECORDED"; index: number; selectedOptionId: string | null; markedForReview: boolean }
  | { type: "HEARTBEAT"; status: ExamStatus; remainingSeconds: number; fullscreenExitCount?: number }
  | { type: "TICK" }
  | { type: "VIOLATION"; status: ExamStatus; fullscreenExitCount: number }
  | { type: "RESUMED" }
  | { type: "FULLSCREEN_UNSUPPORTED" }
  | { type: "SET_DISPLAY_LANG"; lang: DisplayLang }
  | { type: "ERROR"; message: string };

export function createInitialState(totalQuestions: number, remainingSeconds: number): ExamState {
  return {
    status: "in_progress",
    currentIndex: 0,
    totalQuestions,
    currentQuestion: null,
    loadingQuestion: false,
    answered: {},
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
        currentIndex: action.payload.index,
        currentQuestion: action.payload,
        answered: {
          ...state.answered,
          [action.payload.index]: {
            selectedOptionId: action.payload.selectedOptionId,
            markedForReview: action.payload.markedForReview,
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

    case "SET_DISPLAY_LANG":
      return { ...state, displayLang: action.lang };

    case "ERROR":
      return { ...state, loadingQuestion: false, error: action.message };

    default:
      return state;
  }
}
