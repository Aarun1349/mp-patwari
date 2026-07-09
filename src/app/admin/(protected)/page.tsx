export default function AdminHomePage() {
  return (
    <div className="auth-card" style={{ maxWidth: "560px" }}>
      <h1>Admin</h1>
      <p className="muted">
        <a href="/admin/upload">Upload Questions</a>
      </p>
    </div>
  );
}
