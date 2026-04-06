import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Eye,
  Ruler,
} from "lucide-react";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `*,
      listing:listing_id(
        id, title, price, listing_code, listing_type, status,
        bedrooms, bathrooms, floor_area, view_count,
        district,
        categories:category_id(name),
        provinces:province_id(name),
        listing_images(url, is_cover)
      )`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listingTypeLabel: Record<string, string> = { sell: "ขาย", rent: "เช่า", transfer: "เซ้ง" };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft size={18} />
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
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">รายการโปรด</h1>
          <p className="mt-1 text-sm text-slate-500">{favorites?.length ?? 0} รายการ</p>
        </div>

        {!favorites || favorites.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <Heart size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="mb-1 text-sm font-medium text-slate-600">ยังไม่มีรายการโปรด</p>
            <p className="mb-4 text-xs text-slate-400">กดหัวใจในหน้าประกาศเพื่อบันทึกไว้ดูภายหลัง</p>
            <Link href="/listings" className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700">
              ค้นหาประกาศ
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              const listing = fav.listing as {
                id: string; title: string; price: number; listing_code: string;
                listing_type: string; status: string; bedrooms: number;
                bathrooms: number; floor_area: number; view_count: number;
                district: string;
                categories: { name: string } | null;
                provinces: { name: string } | null;
                listing_images: { url: string; is_cover: boolean }[];
              } | null;

              if (!listing || listing.status !== "active") return null;

              const cover = listing.listing_images?.find((i) => i.is_cover) ?? listing.listing_images?.[0];
              const cat = listing.categories;
              const prov = listing.provinces;

              return (
                <Link
                  key={fav.id}
                  href={`/listings/${listing.id}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-slate-100">
                    {cover ? (
                      <img src={cover.url} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Home size={32} className="text-slate-200" /></div>
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white">
                      <Heart size={12} fill="currentColor" />
                    </span>
                    {listing.listing_type && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {listingTypeLabel[listing.listing_type] ?? listing.listing_type}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    <h3 className="mb-1 truncate text-sm font-bold text-slate-800 group-hover:text-teal-600">
                      {listing.title}
                    </h3>
                    {prov && (
                      <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} /> {[listing.district, prov.name].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {(listing.bedrooms || listing.bathrooms || listing.floor_area) && (
                      <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-400">
                        {listing.bedrooms && <span className="flex items-center gap-1"><BedDouble size={12} /> {listing.bedrooms}</span>}
                        {listing.bathrooms && <span className="flex items-center gap-1"><Bath size={12} /> {listing.bathrooms}</span>}
                        {listing.floor_area && <span className="flex items-center gap-1"><Ruler size={12} /> {listing.floor_area} ตร.ม.</span>}
                      </div>
                    )}
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-extrabold text-teal-600">
                        ฿{listing.price ? Number(listing.price).toLocaleString() : "สอบถาม"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Eye size={10} /> {listing.view_count ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
