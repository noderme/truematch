import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWARegister";
import { InstallButton } from "@/components/InstallButton";
import Menu from "@/components/Menu";

export const metadata: Metadata = {
  title: "Kindred",
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
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col font-sans antialiased">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-3 sm:px-4">
          {/* Top Bar: InstallButton + Menu */}
          <header className="sticky top-0 z-30 mb-4 pt-3 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-transparent backdrop-blur">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 shadow-lg shadow-slate-900/50">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-2xl bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-fuchsia-500/40">
                    K
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold tracking-tight">
                      Kindred
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Compatibility-first dating
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <InstallButton />
                </div>
              </div>
              <div className="border-t border-slate-800/80 px-1 sm:px-2">
                <Menu />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 pb-6">{children}</main>
        </div>

        {/* PWA Service Worker */}
        <PWARegister />
      </body>
    </html>
  );
}
