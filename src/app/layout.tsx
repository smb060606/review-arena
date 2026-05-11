import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Review Arena — AI Code Review Comparison",
  description: "Compare AI code review tools side-by-side on the same codebase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-geist)]">
        <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              RA
            </div>
            <span className="text-lg font-semibold">Review Arena</span>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] px-6 py-4 text-center text-sm text-[var(--muted-foreground)]">
          Powered by CodeRabbit
        </footer>
      </body>
    </html>
  );
}
