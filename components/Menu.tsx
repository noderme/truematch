"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export default function Menu() {
  const pathname = usePathname();

  if (!pathname || PUBLIC_ROUTES.includes(pathname)) return null;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  const decoded: any = parseJwt(token);
  // Clear and hide nav if token is expired
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
    if (typeof window !== "undefined") localStorage.removeItem("token");
    return null;
  }

  const userId = decoded?.userId;
  if (!userId) return null;

  const menuItems = [
    { name: "Matches", path: `/match/${userId}` },
    { name: "Chats", path: `/chat/${userId}` },
    { name: "Profile", path: `/profile/${userId}` },
  ];

  return (
    <nav className="flex items-center gap-0.5 px-1 py-1">
      {menuItems.map((item) => {
        const isActive = pathname?.startsWith(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-rose-500/15 via-fuchsia-500/15 to-sky-500/15 text-white border border-fuchsia-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
