"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Simple JWT parser to get payload
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function Menu() {
  const router = useRouter();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded: any = token ? parseJwt(token) : null;
  const userId = decoded?.userId;

  if (!userId) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const menuItems = [
    { name: "Profile", path: `/profile/${userId}` },
    { name: "Matches", path: `/match/${userId}` },
    { name: "Chats", path: `/chat/${userId}` },
  ];

  return (
    <nav className="bg-gradient-to-r from-pink-100 via-purple-50 to-pink-50 shadow-md py-2 flex justify-center gap-4 font-sans text-sm">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`px-3 py-1 rounded-md font-medium transition-colors duration-200
            ${
              router.pathname === item.path
                ? "bg-pink-500 text-white shadow-lg"
                : "text-gray-700 hover:bg-pink-200"
            }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
