// pages/api/addToQueue.ts
import { NextRequest, NextResponse } from "next/server";
import { createTraitsQueue } from "@/lib/queues";

export async function POST(req: NextRequest) {
  const { signupData } = await req.json();

  if (!signupData?.id) {
    return NextResponse.json(
      { error: "signupData with id is required" },
      { status: 400 },
    );
  }

  // ✅ Use RabbitMQ instead of BullMQ
  const traitsQueue = await createTraitsQueue();
  await traitsQueue.send({ id: signupData.id }); // send replaces .add()

  return NextResponse.json({
    status: "ok",
    message: "Traits job added",
  });
}
