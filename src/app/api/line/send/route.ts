import { NextRequest, NextResponse } from "next/server";
import { linePush, listingFlexMessage } from "@/lib/line";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/line/send — เอเจนท์ส่ง listing ให้ลูกค้าผ่าน LINE
export async function POST(request: NextRequest) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    return NextResponse.json({ error: "LINE not configured" }, { status: 503 });
  }

  // Auth check — ต้อง login ถึงจะส่งได้
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, lineUserId } = body;

  if (!listingId || !lineUserId) {
    return NextResponse.json({ error: "Missing listingId or lineUserId" }, { status: 400 });
  }

  // Fetch listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, title, price, district, provinces:province_id(name), listing_images(url, is_cover), bedrooms, bathrooms, floor_area")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const images = (listing.listing_images as { url: string; is_cover: boolean }[]) ?? [];
  const cover = images.find((i) => i.is_cover) ?? images[0];
  const prov = listing.provinces as unknown as { name: string } | null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app";

  const message = listingFlexMessage({
    title: listing.title,
    price: listing.price ? `฿${Number(listing.price).toLocaleString()}` : "สอบถามราคา",
    location: [listing.district, prov?.name].filter(Boolean).join(", ") || "ไม่ระบุ",
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    floor_area: listing.floor_area ? Number(listing.floor_area) : undefined,
    imageUrl: cover?.url,
    url: `${appUrl}/listings/${listing.slug ?? listing.id}`,
  });

  const success = await linePush(lineUserId, [message]);

  if (!success) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
