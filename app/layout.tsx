import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduPrime",
  description: "Study smarter with EduPrime",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}