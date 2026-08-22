import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

/**
 * One grotesk and one mono, and nothing else.
 *
 * The type has to read as an engineering report rather than as a product
 * landing page: Inter carries the display sizes without personality, and the
 * mono is reserved for metadata — timestamps, ids, coordinates — where a
 * fixed width is doing actual work.
 */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Outbreak Radar — Hostel Micro-Outbreak Early Warning System",
  description:
    "Manipal University Jaipur campus food and water-borne illness surveillance — a live thermal map of where illness is concentrating, and what to check first.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Outbreak Radar",
  },
};

export const viewport: Viewport = {
  themeColor: "#F3F2EF",
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
