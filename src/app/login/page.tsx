import { LoginForm } from "./LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  google_failed: "Google sign-in didn't complete. Please try again.",
  google_not_configured: "Google sign-in isn't available yet — please use your mobile number.",
  session_conflict: "This account is already logged in on another device. Please log out there first.",
};

const TRUST_POINTS = [
  "MPPEB पैटर्न पर आधारित असली परीक्षा जैसा अनुभव",
  "पहला फुल मॉक टेस्ट पूरी तरह मुफ़्त, कोई कार्ड डिटेल नहीं",
  "आपका डेटा सुरक्षित — किसी तीसरे पक्ष के साथ साझा नहीं होता",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="login-split">
      <div className="login-brand-panel">
        <div className="login-brand-mark">
          <div className="seal-mark">ऐ</div>
          <div>
            <div className="en">ExamsExpress</div>
            <div className="hi">एमपी पटवारी टेस्ट सीरीज़</div>
          </div>
        </div>

        <h1>
          परीक्षा हॉल में <span className="accent">पहली बार</span> कंप्यूटर पर टेस्ट मत दीजिए
        </h1>
        <p>असली MP पटवारी परीक्षा जैसा टाइमर, सेक्शन और स्क्रीन — यहीं अभ्यास करें, तैयार होकर जाएँ।</p>

        <ul className="login-trust-points">
          {TRUST_POINTS.map((point) => (
            <li key={point}>
              <span className="check">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="login-form-panel">
        <div className="auth-card">
          <h1>Login</h1>
          <p className="muted">Sign in to continue to your dashboard.</p>
          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <a href="/api/auth/google/start" className="auth-oauth-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </a>

          <div className="auth-divider">
            <span>or use your mobile number</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
