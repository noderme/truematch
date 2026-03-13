"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

interface ChatProps {
  currentUser: number;
  matchedUser: number;
}

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  created_at: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat({ currentUser, matchedUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [matchedUsername, setMatchedUsername] = useState<string>("");
  const [matchedPhoto, setMatchedPhoto] = useState<string | null>(null);
  const [showUnmatch, setShowUnmatch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch matched user's name + photo
  useEffect(() => {
    fetch(`/api/users/${matchedUser}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.username) setMatchedUsername(d.user.username);
      })
      .catch(() => {});

    fetch(`/api/users/${matchedUser}/photos`)
      .then((r) => r.json())
      .then((d) => {
        if (d.photos?.[0]) setMatchedPhoto(d.photos[0]);
      })
      .catch(() => {});
  }, [matchedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser},recipient_id.eq.${matchedUser}),and(sender_id.eq.${matchedUser},recipient_id.eq.${currentUser})`,
        )
        .order("created_at", { ascending: true });

      if (error) console.error("[Chat] Fetch error:", error);
      else setMessages(data || []);
      setMessagesLoading(false);
    };

    fetchMessages();
  }, [currentUser, matchedUser]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabaseClient
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg: Message = payload.new as Message;
          if (
            (msg.sender_id === currentUser && msg.recipient_id === matchedUser) ||
            (msg.sender_id === matchedUser && msg.recipient_id === currentUser)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        },
      )
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [currentUser, matchedUser]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const tempId = Date.now();
    const tempMsg: Message = {
      id: tempId,
      sender_id: currentUser,
      recipient_id: matchedUser,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    const { data: inserted, error } = await supabaseClient
      .from("messages")
      .insert({
        sender_id: currentUser,
        recipient_id: matchedUser,
        content: tempMsg.content,
      })
      .select();

    if (error) {
      console.error("[Chat] Insert error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    if (inserted && inserted[0]) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? inserted[0] : m)));
    }
  };

  const handleUnmatch = async () => {
    try {
      await fetch("/api/remove-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser, matchId: matchedUser }),
      });
    } catch {}
    router.push(`/chat/${currentUser}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto w-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex-shrink-0"
        >
          ←
        </button>

        {matchedPhoto ? (
          <img
            src={matchedPhoto}
            alt={matchedUsername}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-700/60"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-fuchsia-500/20 flex-shrink-0">
            {matchedUsername ? matchedUsername.slice(0, 2).toUpperCase() : "…"}
          </div>
        )}

        <div className="flex flex-col leading-tight flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-100 truncate">
            {matchedUsername || "Loading…"}
          </span>
        </div>

        {/* Unmatch */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowUnmatch((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
            title="Options"
          >
            ⋯
          </button>
          {showUnmatch && (
            <div className="absolute right-0 top-10 z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[140px]">
              <button
                onClick={handleUnmatch}
                className="w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 text-left transition"
              >
                Unmatch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" onClick={() => setShowUnmatch(false)}>
        {messagesLoading ? (
          <div className="flex flex-col gap-3">
            {[70, 55, 80, 45, 65].map((w, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className="shimmer h-9 rounded-2xl" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            {matchedPhoto ? (
              <img
                src={matchedPhoto}
                alt={matchedUsername}
                className="w-20 h-20 rounded-full object-cover border-2 border-fuchsia-500/30 shadow-lg shadow-fuchsia-900/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-white text-2xl font-bold">
                {matchedUsername ? matchedUsername.slice(0, 2).toUpperCase() : "?"}
              </div>
            )}
            <div>
              <p className="text-slate-200 font-semibold">{matchedUsername}</p>
              <p className="text-sm text-slate-500 mt-1">You matched! Say hello 👋</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUser;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMine
                        ? "bg-gradient-to-br from-rose-500 via-fuchsia-500 to-fuchsia-600 text-white rounded-br-sm shadow-lg shadow-fuchsia-900/30"
                        : "bg-slate-800/80 border border-slate-700/60 text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-600 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-900/30 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
