// app/match/[userId]/page.tsx
import MatchClient from "@/components/MatchClient";

interface Props {
  params: { userId: string } | Promise<{ userId: string }>;
}

export default async function Page({ params }: Props) {
  const { userId } = await params; // unwrap the promise
  const numericUserId = Number(userId);

  if (!numericUserId) return <p>Invalid user</p>;

  return <MatchClient userId={numericUserId} />;
}
