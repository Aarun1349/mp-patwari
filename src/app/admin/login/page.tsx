import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="auth-page">
      <div>
        <div className="auth-brand">
          <div className="seal-mark">ऐ</div>
          <div className="brand-text">
            <div className="en">ExamsExpress</div>
            <div className="hi">एडमिन कंट्रोलर</div>
          </div>
        </div>
        <div className="auth-card">
          <h1>Admin Login</h1>
          <p className="muted">Internal tool — not the student login.</p>
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
