import type { Metadata, Viewport } from "next";
import { Inter, Literata } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaRegister from "@/components/PwaRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#1C2920",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.remedyafrica.com"),
  title: "RemedyAfrica - Traditional Herbal Remedies",
  description: "Discover traditional African herbal remedies and connect with verified practitioners",
  applicationName: "RemedyAfrica",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RemedyAfrica",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${literata.variable} font-sans antialiased bg-cream text-ink`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaRegister />
          <Providers>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}