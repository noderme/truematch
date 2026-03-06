import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWARegister";
import { InstallButton } from "@/components/InstallButton";
import Menu from "@/components/Menu";

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
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
        {/* Top Bar: InstallButton + Menu */}
        <div className="bg-white shadow-md flex flex-col">
          <div className="flex justify-end p-2">
            <InstallButton />
          </div>
          <Menu />
        </div>

        {/* Main content */}
        <main className="flex-1 p-4">{children}</main>

        {/* PWA Service Worker */}
        <PWARegister />
      </body>
    </html>
  );
}
