"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

type Chat = {
  matchedUserId: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  photo: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Chats() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const decoded: any = parseJwt(token);
    if (!decoded?.userId) { router.push("/login"); return; }

    // Redirect if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    setUserId(decoded.userId);
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`/api/chats?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch chats");
        const data = await res.json();
        setChats(data.chats || []);
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800/60">
            <div className="shimmer w-11 h-11 rounded-full flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="shimmer h-4 w-28 rounded-md" />
              <div className="shimmer h-3 w-48 rounded-md" />
            </div>
            <div className="shimmer h-3 w-10 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!chats.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center px-4">
        <div className="text-4xl">💬</div>
        <div>
          <p className="text-slate-300 font-medium">No chats yet</p>
          <p className="text-sm text-slate-500 mt-1">Match with someone to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 max-h-[calc(100vh-140px)] overflow-y-auto">
      {chats.map((chat) => (
        <button
          key={chat.matchedUserId}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700/80 transition-all duration-200 text-left w-full group"
          onClick={() => router.push(`/chat/${userId}/${chat.matchedUserId}`)}
        >
          {/* Avatar */}
          {chat.photo ? (
            <img
              src={chat.photo}
              alt={chat.name}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-slate-700/60"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-fuchsia-500/20 flex-shrink-0">
              {getInitials(chat.name)}
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-slate-100 text-sm group-hover:text-white transition">
                {chat.name}
              </span>
              <span className="text-[11px] text-slate-600 whitespace-nowrap flex-shrink-0">
                {new Date(chat.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5 max-w-xs">
              {chat.lastMessage || "No messages yet"}
            </p>
          </div>

          {/* Arrow */}
          <span className="text-slate-700 group-hover:text-slate-400 text-sm transition flex-shrink-0">›</span>
        </button>
      ))}
    </div>
  );
}
