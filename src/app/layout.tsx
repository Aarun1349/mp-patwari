import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamsExpress — MP Patwari Test Series",
  description: "Real-time online mock exams for the MP Patwari recruitment exam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <body>{children}</body>
    </html>
  );
}
