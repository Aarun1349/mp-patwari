import type { AnsweredEntry } from "./examReducer";

export function Palette({
  totalQuestions,
  currentIndex,
  answered,
  onJump,
}: {
  totalQuestions: number;
  currentIndex: number;
  answered: Record<number, AnsweredEntry>;
  onJump: (index: number) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }}>
      {Array.from({ length: totalQuestions }, (_, i) => {
        const entry = answered[i];
        const isCurrent = i === currentIndex;
        let background = "#e8e2cf"; // unanswered
        if (entry?.markedForReview) background = "#c9a227";
        else if (entry?.selectedOptionId) background = "#2a7a2a";

        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            style={{
              padding: "8px 0",
              fontSize: "12px",
              fontWeight: 700,
              border: isCurrent ? "2px solid #1a2a44" : "1px solid rgba(26,42,68,0.3)",
              borderRadius: "4px",
              background,
              color: "#1a2a44",
              cursor: "pointer",
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
