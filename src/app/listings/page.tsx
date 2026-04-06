import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import {
  Home,
  Search,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Eye,
  Heart,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  X,
  ArrowUpDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ค้นหาประกาศ",
  description: "ค้นหาบ้าน คอนโด ที่ดิน เซ้งกิจการ ทั่วอีสานตอนบน กรองตามจังหวัด หมวดหมู่ ราคา",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    province?: string;
    category?: string;
    type?: string;
    listing_type?: string;
    min_price?: string;
    max_price?: string;
    bedrooms?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 12;
  const offset = (page - 1) * perPage;

  // Fetch filter options
  const [catRes, provRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("provinces").select("*").order("name"),
  ]);
  const categories = catRes.data ?? [];
  const provinces = provRes.data ?? [];

  // Build query
  let query = supabase
    .from("listings")
    .select(
      `*,
      profiles:user_id(full_name, company_name, is_verified),
      categories:category_id(name, slug),
      provinces:province_id(name, slug),
      listing_images(url, is_cover, sort_order)`,
      { count: "exact" }
    )
    .eq("status", "active");

  // Filters
  if (params.q) {
    // Sanitize: escape SQL LIKE special characters
    const safeQ = params.q.replace(/[%_\\]/g, "\\$&");
    query = query.ilike("title", `%${safeQ}%`);
  }
  if (params.province) {
    query = query.eq("province_id", Number(params.province));
  }
  if (params.category) {
    query = query.eq("category_id", Number(params.category));
  }
  if (params.type) {
    query = query.eq("type", params.type);
  }
  if (params.listing_type) {
    query = query.eq("listing_type", params.listing_type);
  }
  if (params.min_price) {
    query = query.gte("price", Number(params.min_price));
  }
  if (params.max_price) {
    query = query.lte("price", Number(params.max_price));
  }
  if (params.bedrooms) {
    query = query.gte("bedrooms", Number(params.bedrooms));
  }

  // Sort
  switch (params.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    default:
      // Default: active boost first (ยังไม่หมดอายุ), then newest
      query = query
        .order("boost_expires_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
  }

  const { data: listings, count } = await query.range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  // Active filters for pills
  const activeFilters: { key: string; label: string }[] = [];
  if (params.q) activeFilters.push({ key: "q", label: `"${params.q}"` });
  if (params.province) {
    const p = provinces.find((p) => p.id === Number(params.province));
    if (p) activeFilters.push({ key: "province", label: p.name });
  }
  if (params.category) {
    const c = categories.find((c) => c.id === Number(params.category));
    if (c) activeFilters.push({ key: "category", label: c.name });
  }
  if (params.listing_type) {
    const labels: Record<string, string> = { sell: "ขาย", rent: "เช่า", transfer: "เซ้ง" };
    activeFilters.push({ key: "listing_type", label: labels[params.listing_type] ?? params.listing_type });
  }
  if (params.min_price || params.max_price) {
    const min = params.min_price ? `฿${Number(params.min_price).toLocaleString()}` : "";
    const max = params.max_price ? `฿${Number(params.max_price).toLocaleString()}` : "";
    activeFilters.push({ key: "price", label: min && max ? `${min} - ${max}` : min || `ไม่เกิน ${max}` });
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "") p.set(k, v);
    }
    // Reset page when filters change (unless explicitly setting page)
    if (!("page" in overrides)) p.delete("page");
    return `/listings?${p.toString()}`;
  }

  function removeFilter(key: string) {
    if (key === "price") {
      return buildUrl({ min_price: undefined, max_price: undefined });
    }
    return buildUrl({ [key]: undefined });
  }

  const listingTypeLabel: Record<string, string> = {
    sell: "ขาย",
    rent: "เช่า",
    transfer: "เซ้ง",
  };

  const sortOptions = [
    { value: "", label: "แนะนำ" },
    { value: "newest", label: "ใหม่ล่าสุด" },
    { value: "price_asc", label: "ราคาต่ำ → สูง" },
    { value: "price_desc", label: "ราคาสูง → ต่ำ" },
    { value: "popular", label: "ยอดนิยม" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-xl font-extrabold">
              <span className="text-[#1e3a5f]">BanChang</span>
              <span className="text-teal-600">Hub</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              เข้าสู่ระบบ
            </Link>
            <Link href="/listings/new" className="hidden rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 sm:inline-flex">
              ลงประกาศฟรี
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Search Bar */}
        <form action="/listings" method="GET" className="mb-6">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
            {/* Keyword */}
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">ค้นหา</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="ค้นหาบ้าน, คอนโด, ที่ดิน..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
            </div>
            {/* Province */}
            <div className="sm:w-44">
              <label className="mb-1 block text-xs font-medium text-slate-500">จังหวัด</label>
              <select
                name="province"
                defaultValue={params.province}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-teal-500"
              >
                <option value="">ทุกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {/* Category */}
            <div className="sm:w-44">
              <label className="mb-1 block text-xs font-medium text-slate-500">หมวดหมู่</label>
              <select
                name="category"
                defaultValue={params.category}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-teal-500"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {/* Listing type */}
            <div className="sm:w-32">
              <label className="mb-1 block text-xs font-medium text-slate-500">รูปแบบ</label>
              <select
                name="listing_type"
                defaultValue={params.listing_type}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-teal-500"
              >
                <option value="">ทั้งหมด</option>
                <option value="sell">ขาย</option>
                <option value="rent">เช่า</option>
                <option value="transfer">เซ้ง</option>
              </select>
            </div>
            {/* Submit */}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Search size={16} />
              ค้นหา
            </button>
          </div>

          {/* Hidden fields to preserve sort */}
          {params.sort && <input type="hidden" name="sort" value={params.sort} />}
          {params.min_price && <input type="hidden" name="min_price" value={params.min_price} />}
          {params.max_price && <input type="hidden" name="max_price" value={params.max_price} />}
          {params.bedrooms && <input type="hidden" name="bedrooms" value={params.bedrooms} />}
        </form>

        {/* Active Filters + Sort */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.length > 0 && (
              <>
                <span className="text-xs text-slate-400">ตัวกรอง:</span>
                {activeFilters.map((f) => (
                  <Link
                    key={f.key}
                    href={removeFilter(f.key)}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-100"
                  >
                    {f.label}
                    <X size={11} />
                  </Link>
                ))}
                <Link
                  href="/listings"
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
                >
                  ล้างทั้งหมด
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{count ?? 0} รายการ</span>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
              <ArrowUpDown size={12} className="text-slate-400" />
              {sortOptions.map((s) => (
                <Link
                  key={s.value}
                  href={buildUrl({ sort: s.value || undefined })}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    (params.sort ?? "") === s.value
                      ? "bg-teal-600 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {!listings || listings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-20 text-center shadow-sm">
            <Search size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="mb-1 text-sm font-medium text-slate-600">ไม่พบประกาศที่ตรงกัน</p>
            <p className="mb-4 text-xs text-slate-400">ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น</p>
            <Link
              href="/listings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              ดูประกาศทั้งหมด
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const images = (listing.listing_images as { url: string; is_cover: boolean; sort_order: number }[]) ?? [];
              const cover = images.find((i) => i.is_cover) ?? images[0];
              const cat = listing.categories as { name: string; slug: string } | null;
              const prov = listing.provinces as { name: string; slug: string } | null;
              const agent = listing.profiles as { full_name: string; company_name: string; is_verified: boolean } | null;
              const isBoosted = listing.is_boosted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date();

              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className={`group overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
                    isBoosted ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] bg-slate-100">
                    {cover ? (
                      <img src={cover.url} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Home size={32} className="text-slate-200" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      {isBoosted && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          <Zap size={10} /> Boost
                        </span>
                      )}
                      {listing.is_certified && (
                        <span className="flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          <ShieldCheck size={10} /> Certified
                        </span>
                      )}
                    </div>
                    {listing.listing_type && (
                      <span className="absolute right-2 top-2 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {listingTypeLabel[listing.listing_type] ?? listing.listing_type}
                      </span>
                    )}
                    {images.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                        {images.length} รูป
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      {listing.listing_code && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                          {listing.listing_code}
                        </span>
                      )}
                      {cat && (
                        <span className="text-[10px] text-slate-400">{cat.name}</span>
                      )}
                    </div>

                    <h3 className="mb-1 truncate text-sm font-bold text-slate-800 group-hover:text-teal-600">
                      {listing.title}
                    </h3>

                    {prov && (
                      <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} />
                        {[listing.district, prov.name].filter(Boolean).join(", ")}
                      </p>
                    )}

                    {/* Specs */}
                    {(listing.bedrooms || listing.bathrooms || listing.floor_area) && (
                      <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-400">
                        {listing.bedrooms && (
                          <span className="flex items-center gap-1"><BedDouble size={12} /> {listing.bedrooms}</span>
                        )}
                        {listing.bathrooms && (
                          <span className="flex items-center gap-1"><Bath size={12} /> {listing.bathrooms}</span>
                        )}
                        {listing.parking && (
                          <span className="flex items-center gap-1"><Car size={12} /> {listing.parking}</span>
                        )}
                        {listing.floor_area && (
                          <span className="flex items-center gap-1"><Ruler size={12} /> {listing.floor_area} ตร.ม.</span>
                        )}
                      </div>
                    )}

                    {/* Price + Agent */}
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-teal-600">
                          ฿{listing.price ? Number(listing.price).toLocaleString() : "สอบถาม"}
                        </span>
                        {listing.price_per_sqm && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ฿{Number(listing.price_per_sqm).toLocaleString()}/ตร.ม.
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Eye size={10} /> {listing.view_count ?? 0}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ก่อนหน้า
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={buildUrl({ page: String(pageNum) })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium ${
                    page === pageNum
                      ? "bg-teal-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ถัดไป
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
