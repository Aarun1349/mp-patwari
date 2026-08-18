import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Noto_Serif_Devanagari, Space_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "600", "700"],
  variable: "--font-noto-serif-devanagari",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ExamsExpress — Online Mock Test Platform",
  description:
    "Real exam-like online mock tests for Indian competitive exams — practice on the real interface, with instant scorecards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body
        className={`${notoSansDevanagari.variable} ${notoSerifDevanagari.variable} ${spaceMono.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
