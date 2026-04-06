import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Plus,
  Eye,
  Heart,
  Clock,
  ChevronRight,
  FileText,
  Zap,
} from "lucide-react";
import BoostButton from "./boost-button";

export default async function DashboardListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("listings")
    .select(
      `*,
      categories:category_id(name),
      provinces:province_id(name)`
    )
    .eq("user_id", user.id)
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false });

  // เช็คว่ามีแพ็กเกจที่รองรับ boost ไหม
  const { data: canBoostData } = await supabase.rpc("has_active_subscription", {
    check_user_id: user.id,
  });
  const canBoost = canBoostData === true;

  const statusLabel: Record<string, { text: string; cls: string }> = {
    draft: { text: "แบบร่าง", cls: "bg-slate-100 text-slate-600" },
    pending: { text: "รอตรวจ", cls: "bg-yellow-100 text-yellow-700" },
    active: { text: "เผยแพร่", cls: "bg-green-100 text-green-700" },
    sold: { text: "ขายแล้ว", cls: "bg-blue-100 text-blue-600" },
    expired: { text: "หมดอายุ", cls: "bg-red-100 text-red-600" },
    rejected: { text: "ถูกปฏิเสธ", cls: "bg-red-100 text-red-600" },
  };

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">ประกาศของฉัน</h1>
            <p className="mt-1 text-sm text-slate-500">
              ทั้งหมด {listings?.length ?? 0} รายการ
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus size={16} />
            ลงประกาศใหม่
          </Link>
        </div>

        {!listings || listings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
              <FileText size={24} className="text-slate-300" />
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">ยังไม่มีประกาศ</p>
            <p className="mb-4 text-xs text-slate-400">เริ่มต้นลงประกาศทรัพย์สินของคุณวันนี้</p>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              <Plus size={14} />
              ลงประกาศแรก
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const st = statusLabel[listing.status] ?? statusLabel.draft;
              const cat = listing.categories as { name: string } | null;
              const prov = listing.provinces as { name: string } | null;

              const isBoostedActive =
                listing.is_boosted &&
                listing.boost_expires_at &&
                new Date(listing.boost_expires_at) > new Date();

              return (
                <div
                  key={listing.id}
                  className={`rounded-xl border bg-white shadow-sm transition-colors hover:border-slate-300 ${
                    isBoostedActive
                      ? "border-amber-300 ring-1 ring-amber-100"
                      : "border-slate-200"
                  }`}
                >
                  {isBoostedActive && (
                    <div className="flex items-center gap-1.5 border-b border-amber-100 bg-amber-50 px-4 py-1.5 sm:px-5">
                      <Zap size={12} className="text-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-700">
                        กำลังบูสต์ — หมดอายุ{" "}
                        {new Date(listing.boost_expires_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-4 p-4 sm:p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-14 sm:w-14">
                      <Home size={20} className="text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                          {st.text}
                        </span>
                        {listing.listing_code && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                            {listing.listing_code}
                          </span>
                        )}
                        {cat && (
                          <span className="text-[11px] text-slate-400">{cat.name}</span>
                        )}
                      </div>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="mb-1.5 block truncate text-sm font-medium text-slate-800 hover:text-teal-600"
                      >
                        {listing.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        {listing.price && (
                          <span className="font-semibold text-teal-600">
                            ฿{Number(listing.price).toLocaleString()}
                          </span>
                        )}
                        {prov && <span>{prov.name}</span>}
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {listing.view_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={11} /> {listing.save_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />{" "}
                          {new Date(listing.created_at).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {listing.status === "active" && (
                        <BoostButton
                          listingId={listing.id}
                          isBoosted={listing.is_boosted}
                          boostExpiresAt={listing.boost_expires_at}
                          canBoost={canBoost}
                        />
                      )}
                      <Link
                        href={`/listings/${listing.id}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
