// app/chat/[userId]/[matchedUserId]/page.tsx
import Chat from "@/components/Chat";

interface Props {
  params: Promise<{ userId: string; matchedUserId: string }>;
}

export default async function Page({ params }: Props) {
  const { userId, matchedUserId } = await params;
  const currentUserId = Number(userId);
  const matchedUserIdNum = Number(matchedUserId);

  if (!currentUserId || !matchedUserIdNum)
    return <p>Invalid users — check the URL params</p>;

  return <Chat currentUser={currentUserId} matchedUser={matchedUserIdNum} />;
}
