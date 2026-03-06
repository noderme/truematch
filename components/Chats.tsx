"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Simple JWT parser
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
};

export default function Chats() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Decode JWT to get userId
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const decoded: any = parseJwt(token);
    if (!decoded?.userId) {
      router.push("/login");
      return;
    }

    setUserId(decoded.userId);
  }, [router]);

  // Fetch chats from API
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

  if (loading)
    return (
      <div className="text-center py-6 text-gray-500">Loading chats...</div>
    );

  if (!chats.length)
    return <div className="text-center py-6 text-gray-400">No chats yet</div>;

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-150px)] px-4 py-2">
      {chats.map((chat) => (
        <div
          key={chat.matchedUserId}
          className="flex justify-between items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push(`/chat/${userId}/${chat.matchedUserId}`)}
        >
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{chat.name}</span>
            <span className="text-gray-500 text-sm truncate max-w-xs">
              {chat.lastMessage}
            </span>
          </div>
          <div className="text-gray-400 text-xs whitespace-nowrap">
            {new Date(chat.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
