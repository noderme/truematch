// app/match/[userId]/page.tsx
import MatchClient from "@/components/MatchClient";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function Page({ params }: Props) {
  const { userId } = await params;
  const numericUserId = Number(userId);

  if (!numericUserId) return <p>Invalid user</p>;

  return <MatchClient userId={numericUserId} />;
}
