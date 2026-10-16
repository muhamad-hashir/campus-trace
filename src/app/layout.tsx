import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FooterYear from "@/components/FooterYear";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusTrace | Lost & Found",
  description: "Find what you lost, return what you found on campus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        {/* The Navbar reads the session (cookies), so it streams over a static shell. */}
        <Suspense fallback={<div className="h-16 border-b border-gray-200 bg-white" />}>
          <Navbar />
        </Suspense>
        <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <p><FooterYear /></p>
            <p>Campus Lost &amp; Found — post it, spot it, reclaim it.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}