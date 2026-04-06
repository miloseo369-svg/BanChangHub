import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Heart,
  Eye,
  Clock,
  ShieldCheck,
  ChevronRight,
  Star,
  Layers,
  User,
  Lock,
  Crown,
  Calendar,
  Zap,
} from "lucide-react";
import BookingForm from "./booking-form";
import ImageUpload from "./image-upload";
import FavoriteButton from "./favorite-button";
import ListingMap from "./listing-map";
import ReviewsSection from "./reviews-section";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const metaSelect = "title, description, price, provinces:province_id(name), listing_images(url, is_cover)";
  const { data: listing } = isUuid
    ? await supabase.from("listings").select(metaSelect).eq("id", id).single()
    : await supabase.from("listings").select(metaSelect).eq("slug", id).single();

  if (!listing) return { title: "ไม่พบประกาศ" };

  const prov = listing.provinces as unknown as { name: string } | null;
  const images = (listing.listing_images as unknown as { url: string; is_cover: boolean }[]) ?? [];
  const cover = images.find((i) => i.is_cover) ?? images[0];
  const price = listing.price ? `฿${Number(listing.price).toLocaleString()}` : "";

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.com";

  return {
    title: listing.title,
    description: listing.description?.slice(0, 160) || `${listing.title} ${price} ${prov?.name ?? ""}`,
    alternates: { canonical: `${siteUrl}/listings/${id}` },
    openGraph: {
      title: `${listing.title} ${price}`,
      description: listing.description?.slice(0, 160) || `${listing.title} ${prov?.name ?? ""}`,
      images: cover ? [{ url: cover.url, width: 1200, height: 630 }] : undefined,
      type: "article",
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Support both UUID and slug lookup
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const selectQuery = `*,
      profiles:user_id(full_name, phone, avatar_url, company_name, is_verified),
      categories:category_id(name, slug, type),
      provinces:province_id(name, slug),
      listing_images(id, url, alt, sort_order, is_cover)`;

  const { data: listing } = isUuid
    ? await supabase.from("listings").select(selectQuery).eq("id", id).single()
    : await supabase.from("listings").select(selectQuery).eq("slug", id).single();

  if (!listing) notFound();

  // Increment view count (fire and forget — ไม่ block render)
  void supabase.rpc("increment_view_count", { listing_id: id });

  // Check current user & subscription
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let hasSubscription = false;
  if (currentUser) {
    const { data: subData, error: rpcError } = await supabase.rpc(
      "has_active_subscription",
      { check_user_id: currentUser.id }
    );
    if (!rpcError) {
      hasSubscription = subData === true;
    }
  }

  const isOwner = currentUser?.id === listing.user_id;

  // Check if user favorited this listing
  let isFavorited = false;
  if (currentUser) {
    const { data: favData } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("listing_id", id)
      .limit(1);
    isFavorited = (favData?.length ?? 0) > 0;
  }

  // Related listings (same category or province, exclude current)
  const { data: relatedListings } = await supabase
    .from("listings")
    .select("id, slug, title, price, listing_type, provinces:province_id(name), listing_images(url, is_cover)")
    .eq("status", "active")
    .neq("id", listing.id)
    .or(`category_id.eq.${listing.category_id},province_id.eq.${listing.province_id}`)
    .order("view_count", { ascending: false })
    .limit(4);

  const agent = listing.profiles as {
    full_name: string;
    phone: string;
    avatar_url: string;
    company_name: string;
    is_verified: boolean;
  } | null;

  const images = (listing.listing_images as { id: string; url: string; alt: string; sort_order: number; is_cover: boolean }[]) ?? [];
  const coverImage = images.find((i) => i.is_cover) ?? images[0];
  const category = listing.categories as { name: string; slug: string; type: string } | null;
  const province = listing.provinces as { name: string; slug: string } | null;

  const listingTypeLabel: Record<string, string> = {
    sell: "ขาย",
    rent: "เช่า",
    transfer: "เซ้ง",
  };

  const statusLabel: Record<string, { text: string; cls: string }> = {
    draft: { text: "แบบร่าง", cls: "bg-slate-100 text-slate-600" },
    pending: { text: "รอตรวจ", cls: "bg-yellow-100 text-yellow-700" },
    active: { text: "เผยแพร่", cls: "bg-green-100 text-green-700" },
    sold: { text: "ขายแล้ว", cls: "bg-blue-100 text-blue-600" },
    expired: { text: "หมดอายุ", cls: "bg-red-100 text-red-600" },
    rejected: { text: "ถูกปฏิเสธ", cls: "bg-red-100 text-red-600" },
  };

  const st = statusLabel[listing.status] ?? statusLabel.draft;

  const specs = [
    listing.bedrooms && { icon: BedDouble, label: `${listing.bedrooms} ห้องนอน` },
    listing.bathrooms && { icon: Bath, label: `${listing.bathrooms} ห้องน้ำ` },
    listing.parking && { icon: Car, label: `${listing.parking} ที่จอดรถ` },
    listing.floor_area && { icon: Ruler, label: `${listing.floor_area} ตร.ม.` },
    listing.land_area && { icon: Layers, label: listing.land_area },
    listing.floors && { icon: Home, label: `${listing.floors} ชั้น` },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={18} />
              <span className="hidden text-sm sm:inline">กลับ</span>
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
                <Home size={16} className="text-white" />
              </div>
              <span className="text-xl font-extrabold">
                <span className="text-[#1e3a5f]">BanChang</span>
                <span className="text-teal-600">Hub</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
              <Share2 size={16} />
            </button>
            <FavoriteButton
              listingId={id}
              isFavorited={isFavorited}
              isLoggedIn={!!currentUser}
            />
          </div>
        </div>
      </nav>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            (await import("@/lib/jsonld")).listingJsonLd({
              id,
              title: listing.title,
              description: listing.description,
              price: listing.price ? Number(listing.price) : null,
              listing_type: listing.listing_type,
              address: listing.address,
              district: listing.district,
              province: province?.name ?? null,
              latitude: listing.latitude ? Number(listing.latitude) : null,
              longitude: listing.longitude ? Number(listing.longitude) : null,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              floor_area: listing.floor_area ? Number(listing.floor_area) : null,
              images: images.map((i) => i.url),
              agent_name: agent?.full_name ?? null,
              created_at: listing.created_at,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            (await import("@/lib/jsonld")).breadcrumbJsonLd([
              { name: "หน้าแรก", url: "/" },
              { name: "ประกาศ", url: "/listings" },
              ...(category ? [{ name: category.name, url: `/listings?category=${listing.category_id}` }] : []),
              { name: listing.title, url: `/listings/${id}` },
            ])
          ),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-teal-600">
            หน้าแรก
          </Link>
          <ChevronRight size={12} />
          {category && (
            <>
              <span>{category.name}</span>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-slate-600">{listing.title}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery Placeholder */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {coverImage ? (
                <img
                  src={coverImage.url}
                  alt={coverImage.alt || listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-300">
                  <Home size={48} />
                  <p className="mt-2 text-sm">ไม่มีรูปภาพ</p>
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {listing.is_certified && (
                  <div className="flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <ShieldCheck size={12} />
                    Certified
                  </div>
                )}
                {listing.is_boosted &&
                  listing.boost_expires_at &&
                  new Date(listing.boost_expires_at) > new Date() && (
                  <div className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <Zap size={12} />
                    Boosted
                  </div>
                )}
              </div>
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.cls}`}
              >
                {st.text}
              </span>
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
                  1/{images.length} รูป
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {listing.listing_code && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-500">
                    {listing.listing_code}
                  </span>
                )}
                {listing.listing_type && (
                  <span className="rounded bg-[#1e3a5f] px-2 py-0.5 text-[11px] font-semibold text-white">
                    {listingTypeLabel[listing.listing_type] ?? listing.listing_type}
                  </span>
                )}
                {category && (
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                    {category.name}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
                {listing.title}
              </h1>

              {(listing.address || province) && (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} />
                  {[listing.sub_district, listing.district, province?.name]
                    .filter(Boolean)
                    .join(", ") || listing.address}
                </p>
              )}

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-teal-600">
                  ฿
                  {listing.price
                    ? Number(listing.price).toLocaleString()
                    : "สอบถามราคา"}
                </span>
                {listing.price_per_sqm && (
                  <span className="text-sm text-slate-400">
                    (฿{Number(listing.price_per_sqm).toLocaleString()}/ตร.ม.)
                  </span>
                )}
              </div>
            </div>

            {/* Specs */}
            {specs.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-bold text-slate-800">
                  สเปค
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5"
                    >
                      <s.icon size={16} className="text-teal-600" />
                      <span className="text-sm text-slate-700">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-3 text-sm font-bold text-slate-800">
                  รายละเอียด
                </h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {listing.description}
                </div>
              </div>
            )}

            {/* Map — แสดงเมื่อมี lat/lng */}
            {listing.latitude && listing.longitude && (
              <ListingMap
                lat={Number(listing.latitude)}
                lng={Number(listing.longitude)}
                title={listing.title}
              />
            )}

            {/* Reviews */}
            <ReviewsSection
              listingId={id}
              targetUserId={listing.user_id}
              isLoggedIn={!!currentUser}
            />

            {/* Image Upload — เฉพาะเจ้าของ */}
            {isOwner && (
              <ImageUpload
                listingId={id}
                existingImages={images.map((i) => ({
                  id: i.id,
                  url: i.url,
                  is_cover: i.is_cover,
                  sort_order: i.sort_order,
                }))}
              />
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Eye size={12} /> เข้าชม {listing.view_count ?? 0} ครั้ง
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} /> บันทึก {listing.save_count ?? 0} ครั้ง
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />{" "}
                {new Date(listing.created_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Sidebar — Agent Contact */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              {/* Agent Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                    {agent?.full_name?.charAt(0) ?? <User size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-800">
                        {agent?.full_name ?? "ผู้ลงประกาศ"}
                      </p>
                      {agent?.is_verified && (
                        <ShieldCheck
                          size={14}
                          className="text-teal-500"
                        />
                      )}
                    </div>
                    {agent?.company_name && (
                      <p className="text-xs text-slate-500">
                        {agent.company_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* ข้อมูลติดต่อ: แสดงเต็มเฉพาะสมาชิกแพ็กเกจ หรือเจ้าของประกาศ */}
                {hasSubscription || isOwner ? (
                  <div className="space-y-2">
                    {agent?.phone && (
                      <a
                        href={`tel:${agent.phone}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                      >
                        <Phone size={16} />
                        โทร {agent.phone}
                      </a>
                    )}
                    <a
                      href={`https://line.me/R/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-500 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50"
                    >
                      <MessageCircle size={16} />
                      LINE
                    </a>
                    <Link
                      href={`/listings/${id}/inquiry`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Mail size={16} />
                      ส่งข้อความ
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Blurred phone */}
                    {agent?.phone && (
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-400 select-none">
                        <Phone size={16} />
                        <span>{agent.phone.slice(0, 3)}-XXX-XXXX</span>
                      </div>
                    )}
                    <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-400 select-none">
                      <MessageCircle size={16} />
                      LINE: ********
                    </div>

                    {/* Upgrade CTA */}
                    <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center">
                      <Crown size={20} className="mx-auto mb-1.5 text-amber-500" />
                      <p className="mb-1 text-xs font-bold text-amber-800">
                        อัปเกรดเพื่อดูข้อมูลติดต่อ
                      </p>
                      <p className="mb-3 text-[11px] text-amber-600">
                        สมาชิก Pro/Business เห็นเบอร์โทร, LINE
                        และข้อมูลผู้ประกาศทั้งหมด
                      </p>
                      <Link
                        href={currentUser ? "/dashboard/packages" : "/login"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        <Lock size={12} />
                        {currentUser ? "ดูแพ็กเกจ" : "เข้าสู่ระบบ"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Form — แสดงเมื่อ login แล้วและไม่ใช่เจ้าของ */}
              {currentUser && !isOwner && (
                <BookingForm listingId={id} agentId={listing.user_id} />
              )}

              {/* Safety Tips */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-1 text-xs font-bold text-amber-800">
                  คำแนะนำ
                </p>
                <ul className="space-y-1 text-[11px] text-amber-700">
                  <li>• ตรวจสอบทรัพย์สินด้วยตัวเองก่อนโอน</li>
                  <li>• อย่าโอนเงินล่วงหน้าโดยไม่ตรวจสอบ</li>
                  <li>• ใช้สัญญาซื้อขายที่ถูกต้องตามกฎหมาย</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-teal-600">
              ฿{listing.price ? Number(listing.price).toLocaleString() : "สอบถาม"}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {listing.title}
            </p>
          </div>
          {hasSubscription || isOwner ? (
            <>
              {agent?.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <Phone size={14} />
                  โทร
                </a>
              )}
              <a
                href="#booking-section"
                className="flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-xs font-semibold text-white"
              >
                <Calendar size={14} />
                นัดดู
              </a>
            </>
          ) : (
            <Link
              href={currentUser ? "/dashboard/packages" : "/login"}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Lock size={14} />
              ดูข้อมูลติดต่อ
            </Link>
          )}
        </div>
      </div>

      {/* Related Listings */}
      {relatedListings && relatedListings.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
          <h2 className="mb-4 text-lg font-bold text-slate-800">ประกาศที่คล้ายกัน</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedListings.map((r) => {
              const rImages = (r.listing_images as unknown as { url: string; is_cover: boolean }[]) ?? [];
              const rCover = rImages.find((i) => i.is_cover) ?? rImages[0];
              const rProv = r.provinces as unknown as { name: string } | null;
              const listingTypeLabel: Record<string, string> = { sell: "ขาย", rent: "เช่า", transfer: "เซ้ง" };
              return (
                <Link
                  key={r.id}
                  href={`/listings/${r.slug ?? r.id}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-slate-100">
                    {rCover ? (
                      <img src={rCover.url} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Home size={24} className="text-slate-200" /></div>
                    )}
                    {r.listing_type && (
                      <span className="absolute right-2 top-2 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {listingTypeLabel[r.listing_type] ?? r.listing_type}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="mb-1 truncate text-xs font-bold text-slate-800 group-hover:text-teal-600">{r.title}</h3>
                    {rProv && <p className="mb-1 text-[11px] text-slate-400">{rProv.name}</p>}
                    <p className="text-sm font-extrabold text-teal-600">
                      ฿{r.price ? Number(r.price).toLocaleString() : "สอบถาม"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
