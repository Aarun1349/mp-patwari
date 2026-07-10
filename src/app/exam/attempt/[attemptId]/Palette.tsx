"use client";

import { useEffect, useState } from "react";
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

const LEGEND_INDEX = {
  answered: LEGEND[0],
  visited: LEGEND[1],
  review: LEGEND[2],
  unvisited: LEGEND[3],
};

function questionState(entry: AnsweredEntry | undefined): keyof typeof LEGEND_INDEX {
  if (!entry) return "unvisited";
  if (entry.markedForReview) return "review";
  if (entry.selectedOptionId) return "answered";
  return "visited";
}

/** Switching to a subject should land on the first question in it that still
 * needs an answer, not just show the palette grid with the question unchanged. */
function firstUnansweredIndex(section: PaletteSection, answered: Record<number, AnsweredEntry>): number {
  return section.indices.find((i) => !answered[i]?.selectedOptionId) ?? section.indices[0];
}

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
  const [activeCode, setActiveCode] = useState(sections[0]?.code);

  // The active tab follows wherever the exam navigates to, so the palette
  // always shows the section the current question belongs to.
  useEffect(() => {
    const owner = sections.find((s) => s.indices.includes(currentIndex));
    if (owner) setActiveCode(owner.code);
  }, [currentIndex, sections]);

  const activeSection = sections.find((s) => s.code === activeCode) ?? sections[0];

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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "14px",
          paddingBottom: "12px",
          borderBottom: "1px solid rgba(26,42,68,0.12)",
        }}
      >
        {sections.map((section) => (
          <button
            key={section.code}
            type="button"
            onClick={() => {
              setActiveCode(section.code);
              if (section.code !== activeCode) onJump(firstUnansweredIndex(section, answered));
            }}
            style={{
              padding: "6px 10px",
              fontSize: "11.5px",
              fontWeight: 700,
              borderRadius: "4px",
              border: section.code === activeCode ? "1px solid #1a2a44" : "1px solid rgba(26,42,68,0.2)",
              background: section.code === activeCode ? "#1a2a44" : "#fff",
              color: section.code === activeCode ? "#f0e9d8" : "#1a2a44",
              cursor: "pointer",
            }}
          >
            {section.nameEn}
          </button>
        ))}
      </div>

      {activeSection && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px" }}>
          {activeSection.indices.map((i) => {
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
      )}

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
