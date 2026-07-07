import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="auth-page">
      <div className="auth-card auth-card-wide static-content">
        <h1>About ExamsExpress</h1>

        <p>
          The MP Patwari recruitment exam is conducted online by the Madhya Pradesh Employees
          Selection Board (MPPEB/ESB). For many candidates, this is the first time they take a
          computer-based exam — and the unfamiliar interface, on-screen timer, and mouse-based
          navigation can cost valuable time on exam day.
        </p>

        <p>
          ExamsExpress is an independent practice platform built to close that gap. We replicate
          the real exam&apos;s online interface, timer, and rules as closely as possible, so your
          first computer-based exam experience happens during practice, not on exam day.
        </p>

        <h2>What our tests cover</h2>
        <ul>
          <li>General Knowledge</li>
          <li>General Math &amp; Reasoning</li>
          <li>General Hindi</li>
          <li>General English</li>
          <li>Computer Knowledge</li>
          <li>Rural Economy &amp; Panchayati Raj</li>
        </ul>

        <p className="muted">
          ExamsExpress is not affiliated with MPPEB. See our{" "}
          <Link href="/disclaimer">Disclaimer &amp; Policies</Link> for details.
        </p>
      </div>
    </main>
  );
}
