import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, MapPin, BedDouble, Bath, Eye, ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: province } = await supabase
    .from("provinces")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!province) return { title: "ไม่พบจังหวัด" };

  return {
    title: `บ้าน ${province.name} — ซื้อ ขาย เช่า อสังหาริมทรัพย์ ${province.name}`,
    description: `ค้นหาบ้าน คอนโด ที่ดิน เซ้งกิจการ ใน${province.name} ประกาศล่าสุด ราคาดี ตรวจสอบคุณภาพ BanChangHub`,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app"}/listings/province/${slug}` },
    openGraph: {
      title: `อสังหาริมทรัพย์ ${province.name} | BanChangHub`,
      description: `ประกาศขาย เช่า เซ้ง ใน${province.name} — บ้านจัดสรร คอนโด ที่ดิน รับเหมาก่อสร้าง`,
    },
  };
}

export default async function ProvincePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: province } = await supabase
    .from("provinces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!province) redirect("/listings");

  const { data: listings, count } = await supabase
    .from("listings")
    .select(
      "*, categories:category_id(name), listing_images(url, is_cover)",
      { count: "exact" }
    )
    .eq("status", "active")
    .eq("province_id", province.id)
    .order("boost_expires_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  const { breadcrumbJsonLd, localBusinessJsonLd } = await import("@/lib/jsonld");

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: "หน้าแรก", url: "/" },
            { name: "ประกาศ", url: "/listings" },
            { name: province.name, url: `/listings/province/${slug}` },
          ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd({
            name: `BanChangHub ${province.name}`,
            province: province.name,
            description: `อสังหาริมทรัพย์และรับเหมาก่อสร้าง ${province.name}`,
            url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app"}/listings/province/${slug}`,
          })),
        }}
      />

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/listings" className="text-slate-500 hover:text-slate-700"><ArrowLeft size={18} /></Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]"><Home size={16} className="text-white" /></div>
              <span className="text-xl font-extrabold"><span className="text-[#1e3a5f]">BanChang</span><span className="text-teal-600">Hub</span></span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Province Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#1e3a5f] to-teal-700 p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-teal-200 mb-2">
            <MapPin size={16} /> {province.name}
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            อสังหาริมทรัพย์ {province.name}
          </h1>
          <p className="mt-2 text-sm text-teal-100/80">
            บ้าน คอนโด ที่ดิน เซ้งกิจการ — {count ?? 0} ประกาศ
          </p>
          <div className="mt-4 flex gap-2">
            <Link href={`/listings?province=${province.id}&listing_type=sell`}
              className="rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30">ขาย</Link>
            <Link href={`/listings?province=${province.id}&listing_type=rent`}
              className="rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30">เช่า</Link>
            <Link href={`/listings?province=${province.id}&listing_type=transfer`}
              className="rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30">เซ้ง</Link>
          </div>
        </div>

        {/* Listings Grid */}
        {!listings || listings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <Home size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-500">ยังไม่มีประกาศใน{province.name}</p>
            <Link href="/listings/new" className="mt-3 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700">
              ลงประกาศแรกใน{province.name}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const images = (l.listing_images as unknown as { url: string; is_cover: boolean }[]) ?? [];
              const cover = images.find((i) => i.is_cover) ?? images[0];
              const cat = l.categories as unknown as { name: string } | null;
              const listingTypeLabel: Record<string, string> = { sell: "ขาย", rent: "เช่า", transfer: "เซ้ง" };

              return (
                <Link key={l.id} href={`/listings/${l.slug ?? l.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    {cover ? (
                      <img src={cover.url} alt={l.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Home size={32} className="text-slate-200" /></div>
                    )}
                    {l.listing_type && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#1e3a5f] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        {listingTypeLabel[l.listing_type] ?? l.listing_type}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    {cat && <span className="mb-1 inline-block text-[10px] text-slate-400">{cat.name}</span>}
                    <h3 className="mb-1 truncate text-sm font-bold text-slate-800 group-hover:text-teal-600">{l.title}</h3>
                    <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={11} /> {l.district ? `${l.district}, ` : ""}{province.name}
                    </p>
                    {(l.bedrooms || l.bathrooms || l.floor_area) && (
                      <div className="mb-2 flex gap-3 text-[11px] text-slate-400">
                        {l.bedrooms && <span className="flex items-center gap-1"><BedDouble size={12} /> {l.bedrooms}</span>}
                        {l.bathrooms && <span className="flex items-center gap-1"><Bath size={12} /> {l.bathrooms}</span>}
                      </div>
                    )}
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-extrabold text-teal-600">
                        ฿{l.price ? Number(l.price).toLocaleString() : "สอบถาม"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400"><Eye size={10} /> {l.view_count ?? 0}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-800">อสังหาริมทรัพย์ {province.name}</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            BanChangHub รวบรวมประกาศ ขาย เช่า เซ้ง อสังหาริมทรัพย์ใน{province.name} ไม่ว่าจะเป็นบ้านเดี่ยว ทาวน์โฮม คอนโด ที่ดินเปล่า อาคารพาณิชย์
            หรือกิจการให้เซ้ง ทุกประกาศผ่านการตรวจสอบ พร้อมบริการรับเหมาก่อสร้างและรีโนเวทบ้านโดยทีมช่างมืออาชีพ ควบคุมงานโดยวิศวกร
            ค้นหาทรัพย์สินที่เหมาะกับคุณได้ที่ BanChangHub — แพลตฟอร์มอสังหาริมทรัพย์อันดับ 1 อีสานตอนบน
          </p>
        </div>

        {/* All provinces links — internal linking */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold text-slate-800">อสังหาริมทรัพย์จังหวัดอื่นๆ</h3>
          <div className="flex flex-wrap gap-2">
            {["udon-thani", "nong-khai", "khon-kaen", "loei", "nong-bua-lam-phu", "sakon-nakhon", "nakhon-phanom", "bueng-kan"].map((s) => (
              <Link key={s} href={`/listings/province/${s}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${s === slug ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
