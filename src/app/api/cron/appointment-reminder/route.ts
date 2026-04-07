import { NextRequest, NextResponse } from "next/server";
import { linePush, appointmentReminderMessage } from "@/lib/line";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Vercel Cron: ทุกวัน 8:00 AM (Asia/Bangkok = 01:00 UTC)
// cron: 0 1 * * *

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    return NextResponse.json({ error: "LINE not configured", sent: 0 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // ดึงนัดหมายวันนี้ที่ confirmed
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      requester:requester_id(full_name, line_id),
      agent:agent_id(full_name, line_id),
      listing:listing_id(title)
    `)
    .eq("scheduled_date", today)
    .eq("status", "confirmed");

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No appointments today" });
  }

  let sent = 0;

  for (const apt of appointments) {
    const listing = apt.listing as { title: string } | null;
    const requester = apt.requester as { full_name: string; line_id: string } | null;
    const agent = apt.agent as { full_name: string; line_id: string } | null;

    const reminderData = {
      title: listing?.title ?? "ทรัพย์สิน",
      date: new Date(apt.scheduled_date).toLocaleDateString("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      time: (apt.scheduled_time as string).slice(0, 5) + " น.",
      location: apt.location ?? undefined,
    };

    // ส่งให้ agent (เจ้าของประกาศ)
    if (agent?.line_id) {
      const msg = appointmentReminderMessage({
        ...reminderData,
        requesterName: requester?.full_name ?? "ผู้นัด",
      });
      const ok = await linePush(agent.line_id, [msg]);
      if (ok) sent++;
    }

    // ส่งให้ requester (ผู้นัด)
    if (requester?.line_id) {
      const msg = appointmentReminderMessage({
        ...reminderData,
        requesterName: agent?.full_name ?? "เอเจนท์",
      });
      const ok = await linePush(requester.line_id, [msg]);
      if (ok) sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, total: appointments.length });
}
