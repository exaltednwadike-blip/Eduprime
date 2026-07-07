import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduPrime - Study Smarter. Pass Faster.",
  description: "Study smarter with past questions and CBT practice.",
  metadataBase: new URL("https://eduprime.com.ng"),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="fixed left-4 top-4 z-50 flex items-center rounded-full bg-[#062f17]/90 px-3 py-2 text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
          <img src="/logo.png" alt="EduPrime logo" className="h-10 w-10" />
        </div>
        {children}
      </body>
    </html>
  );
}
