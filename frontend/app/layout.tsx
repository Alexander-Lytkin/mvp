import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"]
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Music Search — Deezer",
  description: "Search tracks via Deezer and save favorites"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${sans.variable} ${mono.variable} min-h-screen antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
