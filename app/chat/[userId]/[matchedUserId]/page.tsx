// app/chat/[userId]/[matchedUserId]/page.tsx
"use client"; // Chat is a client component

import Chat from "@/components/Chat";

interface Props {
  params:
    | { userId: string; matchedUserId: string }
    | Promise<{ userId: string; matchedUserId: string }>;
}

export default async function Page({ params }: Props) {
  const { userId, matchedUserId } = await params; // unwrap the promise
  const currentUserId = Number(userId);
  const matchedUserIdNum = Number(matchedUserId);

  if (!currentUserId || !matchedUserIdNum)
    return <p>Invalid users — check the URL params</p>;

  return <Chat currentUser={currentUserId} matchedUser={matchedUserIdNum} />;
}
