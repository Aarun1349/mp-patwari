export function ViolationModal({
  fullscreenExitCount,
  onResume,
}: {
  fullscreenExitCount: number;
  onResume: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,26,44,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div className="auth-card" style={{ maxWidth: "420px" }}>
        <h1>Exam paused</h1>
        <p>
          You exited fullscreen or switched away from this tab. Violations:{" "}
          <strong>{fullscreenExitCount}/3</strong>. Your attempt will be locked and auto-submitted
          after the 3rd violation.
        </p>
        <button type="button" onClick={onResume} style={{ marginTop: "12px" }}>
          Resume Exam
        </button>
      </div>
    </div>
  );
}
