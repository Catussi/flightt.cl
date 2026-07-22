import { NextRequest, NextResponse } from "next/server";
import { runPickupReminders } from "@/lib/notifications/pickupReminder";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sent = await runPickupReminders();
  return NextResponse.json({ ok: true, sent });
}
