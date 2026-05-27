import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KreatorOS AI v4",
  description: "AI creator business operator with booking, store, brand deals, research automation, and workflow agents."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
