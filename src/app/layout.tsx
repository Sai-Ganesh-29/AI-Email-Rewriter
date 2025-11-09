import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Email Rewriter",
  description: "AI-powered email rewriter built with Next.js + OpenRouter"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
