import type { Metadata } from "next";
import { Hanken_Grotesk, Fraunces, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KreatorOS — AI creator business operator",
  description:
    "Run your entire creator business from one operator: booking, store, brand deals, research automation, and agent workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(sans.variable, display.variable, mono.variable, "font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
}
