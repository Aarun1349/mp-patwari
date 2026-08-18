import { AdminLoginForm } from "./AdminLoginForm";

/** ExamsExpress "EE" app icon (matches src/app/icon.svg). */
function BrandIcon() {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#1a2a44" />
      <g fill="#ffffff" opacity="0.9">
        <rect x="7" y="24" width="9" height="4.5" rx="2.25" />
        <rect x="9" y="32" width="12" height="4.5" rx="2.25" />
        <rect x="7" y="40" width="9" height="4.5" rx="2.25" />
      </g>
      <text x="18" y="45.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="30" fill="#ffffff" fontStyle="italic">
        E
      </text>
      <text x="35" y="45.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="30" fill="#f2a922" fontStyle="italic">
        E
      </text>
    </svg>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="ee-login">
      <aside className="ee-login__brand">
        <div className="ee-login__brandmark">
          <BrandIcon />
          <span className="ee-login__brandname">ExamsExpress</span>
        </div>

        <div className="ee-login__hero">
          <h2>The control room for your exam platform.</h2>
          <p>Manage exams, teachers, question banks, packages and revenue — all from one place.</p>
          <div className="ee-login__points">
            <span>Exams, papers &amp; question banks</span>
            <span>Teacher storefronts &amp; payouts</span>
            <span>Orders, coupons &amp; analytics</span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, fontSize: "12.5px", color: "rgba(255,255,255,0.6)" }}>
          Internal tool — not the student login.
        </div>
      </aside>

      <section className="ee-login__form">
        <div className="ee-login__card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to your admin dashboard.</p>
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
