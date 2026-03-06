"use client"; // needed if you use hooks like useState, useEffect

import Chats from "@/components/Chats"; // your Chats component
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const userId = params.userId;

  if (!userId) return <div>User not found</div>;

  return (
    <div className="p-4">
      {/* Pass the userId to your Chats component if needed */}
      <Chats />
    </div>
  );
}
