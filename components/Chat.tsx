"use client";

import { useEffect, useState, useRef } from "react";
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

export default function Chat({ currentUser, matchedUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    };

    fetchMessages();
  }, [currentUser, matchedUser]);

  // Realtime subscription
  // Realtime subscription
  useEffect(() => {
    const channel = supabaseClient
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg: Message = payload.new as Message;

          // Only add messages relevant to this chat
          if (
            (msg.sender_id === currentUser &&
              msg.recipient_id === matchedUser) ||
            (msg.sender_id === matchedUser && msg.recipient_id === currentUser)
          ) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
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

    // Add temp message
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // Insert real message
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
      // Rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    // Replace temp message with real one
    if (inserted && inserted[0]) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? inserted[0] : m)),
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md flex flex-col bg-zinc-900 rounded-xl shadow-lg overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-md max-w-xs break-words ${
                msg.sender_id === currentUser
                  ? "bg-green-400 text-black self-end"
                  : "bg-zinc-800 text-white self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex p-4 gap-2 border-t border-zinc-700 bg-zinc-900">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-md bg-zinc-800 text-white focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-green-400 text-black px-4 rounded-md font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
