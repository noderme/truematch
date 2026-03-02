import { supabaseServer } from "@/lib/supabaseserver";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");

  if (!user1 || !user2) {
    return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("chats")
    .select("*")
    .or(`user_id.eq.${user1},user_id.eq.${user2}`)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}
