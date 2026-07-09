import type { AnsweredEntry } from "./examReducer";

export interface PaletteSection {
  code: string;
  nameEn: string;
  nameHi: string;
  indices: number[];
}

const LEGEND: { label: string; background: string; border: string }[] = [
  { label: "Answered", background: "#2a7a2a", border: "#2a7a2a" },
  { label: "Visited, not answered", background: "#f3d9da", border: "#a3242a" },
  { label: "Marked for review", background: "#c9a227", border: "#c9a227" },
  { label: "Not visited yet", background: "#f0e9d8", border: "rgba(26,42,68,0.25)" },
];

function questionState(entry: AnsweredEntry | undefined): keyof typeof LEGEND_INDEX {
  if (!entry) return "unvisited";
  if (entry.markedForReview) return "review";
  if (entry.selectedOptionId) return "answered";
  return "visited";
}

const LEGEND_INDEX = {
  answered: LEGEND[0],
  visited: LEGEND[1],
  review: LEGEND[2],
  unvisited: LEGEND[3],
};

export function Palette({
  sections,
  currentIndex,
  answered,
  onJump,
}: {
  sections: PaletteSection[];
  currentIndex: number;
  answered: Record<number, AnsweredEntry>;
  onJump: (index: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-space-mono, monospace)",
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#5c5c5c",
          marginBottom: "10px",
        }}
      >
        Question Overview
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {sections.map((section) => (
          <div key={section.code}>
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a2a44", marginBottom: "6px" }}>
              {section.nameEn}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px" }}>
              {section.indices.map((i) => {
                const state = questionState(answered[i]);
                const { background, border } = LEGEND_INDEX[state];
                const isCurrent = i === currentIndex;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onJump(i)}
                    style={{
                      padding: "7px 0",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: isCurrent ? "2px solid #1a2a44" : `1px solid ${border}`,
                      borderRadius: "4px",
                      background,
                      color: state === "answered" ? "#fff" : "#1a2a44",
                      cursor: "pointer",
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "18px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(26,42,68,0.15)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {LEGEND.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#444" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: item.background,
                border: `1px solid ${item.border}`,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
