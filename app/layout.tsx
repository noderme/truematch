import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWARegister";
import { InstallButton } from "@/components/InstallButton";

export const metadata: Metadata = {
  title: "AI Match App",
  description: "AI-powered compatibility matching",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="p-4 flex justify-end">
          <InstallButton />
        </header>

        {children}

        <PWARegister />
      </body>
    </html>
  );
}
