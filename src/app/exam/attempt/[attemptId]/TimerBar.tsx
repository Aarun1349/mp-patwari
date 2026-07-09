function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerBar({ remainingSeconds }: { remainingSeconds: number }) {
  const low = remainingSeconds <= 5 * 60;
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontSize: "9.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(240,233,216,0.6)",
        }}
      >
        Time Left
      </div>
      <div
        className="mono"
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: low ? "#ff8a80" : "#f0e9d8",
        }}
      >
        {formatTime(remainingSeconds)}
      </div>
    </div>
  );
}
