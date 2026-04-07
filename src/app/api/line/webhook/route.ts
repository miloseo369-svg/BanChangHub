import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineReply, listingFlexMessage, type LineWebhookEvent } from "@/lib/line";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hash = crypto.createHmac("SHA256", secret).update(body).digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  // Verify signature (skip in dev if no secret)
  if (process.env.LINE_CHANNEL_SECRET && !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = JSON.parse(body);
  const events: LineWebhookEvent[] = parsed.events ?? [];

  for (const event of events) {
    if (event.type === "message" && event.message?.type === "text") {
      const text = event.message.text?.trim() ?? "";
      const replyToken = event.replyToken;

      if (!replyToken) continue;

      // คำสั่ง: ค้นหาทรัพย์สิน
      if (text.startsWith("หา") || text.startsWith("ค้นหา") || text.startsWith("search")) {
        const keyword = text.replace(/^(หา|ค้นหา|search)\s*/i, "").trim();
        await handleSearch(replyToken, keyword);
      }
      // คำสั่ง: ดูประกาศล่าสุด
      else if (text === "ล่าสุด" || text === "ใหม่" || text === "new") {
        await handleLatest(replyToken);
      }
      // คำสั่ง: ช่วยเหลือ
      else if (text === "help" || text === "เมนู" || text === "menu") {
        await handleHelp(replyToken);
      }
      // Default
      else {
        await handleHelp(replyToken);
      }
    }

    // User follow bot
    if (event.type === "follow" && event.source.userId) {
      await handleFollow(event.replyToken!, event.source.userId);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleSearch(replyToken: string, keyword: string) {
  if (!keyword) {
    await lineReply(replyToken, [{ type: "text", text: 'พิมพ์ "หา" ตามด้วยคำค้น เช่น\n\nหา บ้านอุดรธานี\nหา คอนโดหนองคาย' }]);
    return;
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, price, district, provinces:province_id(name), listing_images(url, is_cover), bedrooms, bathrooms, floor_area")
    .eq("status", "active")
    .ilike("title", `%${keyword.replace(/[%_\\]/g, "\\$&")}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!listings || listings.length === 0) {
    await lineReply(replyToken, [{ type: "text", text: `ไม่พบประกาศที่ตรงกับ "${keyword}"\n\nลองค้นหาด้วยคำอื่น หรือพิมพ์ "ล่าสุด" เพื่อดูประกาศใหม่` }]);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app";
  const messages = listings.slice(0, 3).map((l) => {
    const images = (l.listing_images as { url: string; is_cover: boolean }[]) ?? [];
    const cover = images.find((i) => i.is_cover) ?? images[0];
    const prov = l.provinces as unknown as { name: string } | null;

    return listingFlexMessage({
      title: l.title,
      price: l.price ? `฿${Number(l.price).toLocaleString()}` : "สอบถามราคา",
      location: [l.district, prov?.name].filter(Boolean).join(", ") || "ไม่ระบุ",
      bedrooms: l.bedrooms ?? undefined,
      bathrooms: l.bathrooms ?? undefined,
      floor_area: l.floor_area ? Number(l.floor_area) : undefined,
      imageUrl: cover?.url,
      url: `${appUrl}/listings/${l.slug ?? l.id}`,
    });
  });

  await lineReply(replyToken, messages);
}

async function handleLatest(replyToken: string) {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, price, district, provinces:province_id(name), listing_images(url, is_cover), bedrooms, bathrooms, floor_area")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!listings || listings.length === 0) {
    await lineReply(replyToken, [{ type: "text", text: "ยังไม่มีประกาศ" }]);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app";
  const messages = listings.map((l) => {
    const images = (l.listing_images as { url: string; is_cover: boolean }[]) ?? [];
    const cover = images.find((i) => i.is_cover) ?? images[0];
    const prov = l.provinces as unknown as { name: string } | null;

    return listingFlexMessage({
      title: l.title,
      price: l.price ? `฿${Number(l.price).toLocaleString()}` : "สอบถามราคา",
      location: [l.district, prov?.name].filter(Boolean).join(", ") || "ไม่ระบุ",
      bedrooms: l.bedrooms ?? undefined,
      bathrooms: l.bathrooms ?? undefined,
      floor_area: l.floor_area ? Number(l.floor_area) : undefined,
      imageUrl: cover?.url,
      url: `${appUrl}/listings/${l.slug ?? l.id}`,
    });
  });

  await lineReply(replyToken, messages);
}

async function handleFollow(replyToken: string, _userId: string) {
  await lineReply(replyToken, [
    {
      type: "text",
      text: "ยินดีต้อนรับสู่ BanChangHub! 🏡\n\nพิมพ์คำสั่งเหล่านี้ได้เลย:\n\n🔍 หา [คำค้น]\n  เช่น \"หา บ้านอุดร\"\n\n🆕 ล่าสุด\n  ดูประกาศใหม่ล่าสุด\n\n❓ เมนู\n  ดูคำสั่งทั้งหมด",
    },
  ]);
}

async function handleHelp(replyToken: string) {
  await lineReply(replyToken, [
    {
      type: "text",
      text: "BanChangHub Bot 🏡\n\nคำสั่งที่ใช้ได้:\n\n🔍 หา [คำค้น]\n  ค้นหาทรัพย์สิน\n  เช่น \"หา บ้านอุดร\"\n  \"หา คอนโดหนองคาย\"\n\n🆕 ล่าสุด\n  ดูประกาศใหม่ล่าสุด\n\n🌐 เว็บไซต์\n  banchanghub.vercel.app",
    },
  ]);
}
