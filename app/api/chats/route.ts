import { pool } from "@/lib/db";
import { supabaseClient } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Step 1: Fetch all messages where user is sender or recipient
    const { data: messages, error: msgError } = await supabaseClient
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;

    // Step 2: Group messages by matchedUserId, keep latest message per chat
    const chatMap = new Map<string, any>();
    messages.forEach((msg) => {
      const matchedUserId =
        msg.sender_id === Number(userId) ? msg.recipient_id : msg.sender_id;
      if (!chatMap.has(matchedUserId)) {
        chatMap.set(matchedUserId, {
          matchedUserId: matchedUserId.toString(),
          lastMessage: msg.content,
          timestamp: msg.created_at,
        });
      } else {
        const existing = chatMap.get(matchedUserId);
        if (new Date(msg.created_at) > new Date(existing.timestamp)) {
          existing.lastMessage = msg.content;
          existing.timestamp = msg.created_at;
        }
      }
    });

    const matchedUserIds = Array.from(chatMap.keys()).map(Number);

    if (!matchedUserIds.length) {
      return NextResponse.json({ chats: [] });
    }

    // Step 3: Fetch username + first photo for each matched user
    const { rows: users } = await pool.query(
      `SELECT u.id, u.username, p.url AS photo
       FROM users u
       LEFT JOIN (
         SELECT DISTINCT ON (user_id) user_id, url
         FROM photos
         ORDER BY user_id, position ASC
       ) p ON p.user_id = u.id
       WHERE u.id = ANY($1::int[])`,
      [matchedUserIds],
    );

    const userMap = new Map(
      users.map((u: any) => [u.id, { username: u.username, photo: u.photo ?? null }]),
    );

    // Step 4: Construct final chats array
    const chats = Array.from(chatMap.values()).map((chat) => {
      const info = userMap.get(Number(chat.matchedUserId));
      return {
        ...chat,
        name: info?.username || "Unknown",
        photo: info?.photo || null,
      };
    });

    return NextResponse.json({ chats });
  } catch (err: any) {
    console.error("Error fetching chats:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
