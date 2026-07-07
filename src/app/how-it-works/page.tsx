import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="auth-page">
      <div className="auth-card auth-card-wide static-content">
        <h1>How It Works</h1>

        <h2>1. Create an account</h2>
        <p>Register with your mobile number and a one-time OTP — no password to remember.</p>

        <h2>2. Take your free mock test</h2>
        <p>
          Every account gets one full-length free mock test, with the same interface, timer, and
          rules as our paid tests.
        </p>

        <h2>3. Buy a package for more tests</h2>
        <p>Choose a 5, 10, or 20-test package based on how much practice you need.</p>

        <h2>The exam experience</h2>
        <ul>
          <li>The exam runs in fullscreen mode. Exiting fullscreen, switching tabs, or minimizing the window counts as a violation.</li>
          <li>After 3 violations, your attempt is automatically locked and submitted with whatever answers you&apos;ve recorded so far.</li>
          <li>The countdown timer is controlled by our server, not your browser — closing the tab does not stop the clock.</li>
          <li>The exam auto-submits when time runs out.</li>
          <li>You can attempt each test paper only once.</li>
          <li>Right-click, text selection, and copy/paste are disabled during the exam.</li>
        </ul>

        <h2>After you submit</h2>
        <p>
          You&apos;ll immediately see your score, accuracy, and a section-wise breakdown on your{" "}
          <Link href="/history">practice history</Link> page.
        </p>

        <p className="muted">
          See our <Link href="/disclaimer">Disclaimer &amp; Policies</Link> for refund and support
          information.
        </p>
      </div>
    </main>
  );
}
