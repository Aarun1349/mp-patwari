function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerBar({ remainingSeconds }: { remainingSeconds: number }) {
  const low = remainingSeconds <= 5 * 60;
  return (
    <div
      className="mono"
      style={{
        fontSize: "20px",
        fontWeight: 700,
        color: low ? "#a3242a" : "#1a2a44",
        padding: "8px 0",
      }}
    >
      {formatTime(remainingSeconds)}
    </div>
  );
}
