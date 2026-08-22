import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Instrument_Serif } from "next/font/google";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Outbreak Radar — Hostel Micro-Outbreak Early Warning System",
  description: "Manipal University Jaipur campus food and water-borne illness surveillance & spatial scan statistic detection.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Outbreak Radar",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef2f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#fafafa] text-zinc-900 selection:bg-zinc-900 selection:text-white">
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
