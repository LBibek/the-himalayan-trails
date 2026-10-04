import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PwaProvider from "@/components/providers/PwaProvider";
import OfflineBanner from "@/components/ui/OfflineBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export const metadata: Metadata = {
  title: "The Himalayan Trails — Interactive Trekking & Mountain Explorer",
  description: "3D map explorer, itinerary planner, live weather hazards, landmark guide, and trekker stories across the Himalayas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Himalayan Trails",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
        <PwaProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <OfflineBanner />
          <Footer />
        </PwaProvider>
      </body>
    </html>
  );
}
