import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="app-footer">
      ExamsExpress · MP Patwari Test Series — an independent practice platform, not affiliated with
      MPPEB
      <div className="footer-links">
        <Link href="/about">About</Link>
        <Link href="/how-it-works">How It Works</Link>
        <Link href="/disclaimer">Disclaimer &amp; Policies</Link>
      </div>
    </footer>
  );
}
