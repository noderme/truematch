import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ server only
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const userId = formData.get("userId") as string;
    const files = formData.getAll("files") as File[];

    if (!userId || files.length === 0) {
      return NextResponse.json(
        { error: "Missing userId or files" },
        { status: 400 },
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("photos") // your bucket name
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      // Get public URL
      const { data } = supabase.storage.from("photos").getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error: any) {
    console.error("Upload photos error:", error);
    return NextResponse.json({ error: "Photo upload failed" }, { status: 500 });
  }
}
