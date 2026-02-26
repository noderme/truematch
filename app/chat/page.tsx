"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface Message {
  sender: string; // "me" or "other"
  text: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const userA = searchParams.get("userA");
  const userB = searchParams.get("userB");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "me", text: input.trim() }]);
    setInput("");

    // Mock "other user" reply for testing
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "other", text: "Thanks for your message!" },
      ]);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="flex-1 overflow-y-auto mb-4 p-2 border rounded-lg bg-white flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[75%] p-2 rounded-lg ${
              msg.sender === "me"
                ? "bg-blue-500 text-white self-end"
                : "bg-gray-200 text-gray-800 self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-lg p-2"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
