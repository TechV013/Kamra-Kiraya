import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { VisualEditsMessenger } from "orchids-visual-edits";
import { Toaster } from "react-hot-toast";

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import SmoothScroll from "@/components/providers/SmoothScroll";
import ChatbotWrapper from "@/components/ai/ChatbotWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "कमरा किराया – Student Room Booking Platform",
  description:
    "Find and book verified rental rooms, PG, and hostels near your college. कमरा किराया makes student accommodation easy.",
  keywords:
    "student rooms, PG, hostel, rental rooms, college accommodation, कमरा किराया",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SmoothScroll>
          <Navbar />

          <main className="min-h-screen pt-16">
            {children}
          </main>

          <Footer />
        </SmoothScroll>

        <ChatbotWrapper />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "12px",
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              fontSize: "14px",
            },
          }}
        />

        <VisualEditsMessenger />
      </body>
    </html>
  );
}