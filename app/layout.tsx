import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo Her — Pitch practice",
  description: "A space for entrepreneurial women to practice their pitch, find their voice, and meet the moment.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
