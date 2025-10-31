import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1e40af",
};

export const metadata: Metadata = {
  title: "CRMS - Criminal Record Management System",
  description: "Criminal Record Management System - Pan-African Digital Public Good for law enforcement agencies. Pilot: Sierra Leone Police Force. Offline-first design for low-connectivity environments.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CRMS",
  },
  applicationName: "CRMS",
  keywords: ["police", "criminal records", "law enforcement", "offline", "PWA", "Africa"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
