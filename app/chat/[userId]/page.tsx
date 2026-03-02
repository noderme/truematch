// app/chat/[userId]/page.tsx
import Chat from "@/components/Chat";

interface PageProps {
  params: { userId: string } | Promise<{ userId: string }>;
  searchParams?:
    | { matchedUserID?: string }
    | Promise<{ matchedUserID?: string }>;
}

export default async function Page(pageProps: PageProps) {
  // Unwrap Promises if needed
  const params = await pageProps.params;
  const searchParams = pageProps.searchParams
    ? await pageProps.searchParams
    : undefined;

  const matchedUserId = Number(searchParams?.matchedUserID);
  const currentUserId = Number(params.userId);

  if (!currentUserId || !matchedUserId)
    return <p>Invalid users — check the URL params</p>;

  return <Chat currentUser={currentUserId} matchedUser={matchedUserId} />;
}
