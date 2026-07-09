import type { QuestionPayload } from "./examReducer";

export function QuestionPanel({
  question,
  onSelect,
  onToggleReview,
}: {
  question: QuestionPayload;
  onSelect: (optionId: string) => void;
  onToggleReview: (markedForReview: boolean) => void;
}) {
  return (
    <div>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#5c5c5c", margin: 0 }}>
        Question {question.index + 1} of {question.total} — {question.section.nameEn}
      </p>
      <p style={{ fontSize: "16px", margin: "12px 0", color: "#1a2a44" }}>{question.text}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {question.options.map((option) => (
          <label
            key={option.id}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              padding: "10px",
              border:
                question.selectedOptionId === option.id
                  ? "1px solid #a3242a"
                  : "1px solid rgba(26,42,68,0.2)",
              borderRadius: "4px",
              cursor: "pointer",
              background: question.selectedOptionId === option.id ? "rgba(163,36,42,0.08)" : "transparent",
              color: "#1a2a44",
            }}
          >
            <input
              type="radio"
              name={`question-${question.questionId}`}
              checked={question.selectedOptionId === option.id}
              onChange={() => onSelect(option.id)}
            />
            <span>
              <strong>{option.label}.</strong> {option.text}
            </span>
          </label>
        ))}
      </div>

      <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", color: "#1a2a44" }}>
        <input
          type="checkbox"
          checked={question.markedForReview}
          onChange={(e) => onToggleReview(e.target.checked)}
        />
        Mark for review
      </label>
    </div>
  );
}
