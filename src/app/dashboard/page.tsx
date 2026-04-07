import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Settings,
  LogOut,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  Package,
  User,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import NotificationBell from "./notifications";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user's listings
  const { data: listings, count: listingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch stats
  const { count: favCount } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: inquiryCount } = await supabase
    .from("inquiries")
    .select("*, listings!inner(user_id)", { count: "exact", head: true })
    .eq("listings.user_id", user.id)
    .eq("status", "new");

  // Fetch upcoming appointments (as agent)
  const today = new Date().toISOString().slice(0, 10);
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(
      `*,
      requester:requester_id(full_name, avatar_url),
      listing:listing_id(title, listing_code)`
    )
    .eq("agent_id", user.id)
    .gte("scheduled_date", today)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .limit(5);

  const totalViews =
    listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) ?? 0;

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || "ผู้ใช้งาน";

  const stats = [
    {
      label: "ประกาศทั้งหมด",
      value: listingCount ?? 0,
      icon: FileText,
      color: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
      bgCard: "border-blue-100",
    },
    {
      label: "ยอดเข้าชม",
      value: totalViews,
      icon: Eye,
      color: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
      bgCard: "border-teal-100",
    },
    {
      label: "รายการโปรด",
      value: favCount ?? 0,
      icon: Heart,
      color: "bg-gradient-to-br from-pink-500 to-rose-600 text-white",
      bgCard: "border-pink-100",
    },
    {
      label: "ข้อความใหม่",
      value: inquiryCount ?? 0,
      icon: MessageCircle,
      color: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
      bgCard: "border-amber-100",
    },
  ];

  const statusLabel: Record<string, { text: string; cls: string }> = {
    draft: { text: "แบบร่าง", cls: "bg-slate-100 text-slate-600" },
    pending: { text: "รอตรวจ", cls: "bg-yellow-100 text-yellow-700" },
    active: { text: "เผยแพร่", cls: "bg-green-100 text-green-700" },
    sold: { text: "ขายแล้ว", cls: "bg-blue-100 text-blue-600" },
    expired: { text: "หมดอายุ", cls: "bg-red-100 text-red-600" },
    rejected: { text: "ถูกปฏิเสธ", cls: "bg-red-100 text-red-600" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#faf9f6] to-teal-50/30">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e3a5f] to-teal-700">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-xl font-extrabold">
              <span className="text-[#1e3a5f]">BanChang</span>
              <span className="text-teal-600">Hub</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-bold text-white shadow-sm"
            >
              {displayName.charAt(0)}
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a5f] via-[#1a4971] to-teal-700 p-6 text-white shadow-lg sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">
              สวัสดี, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-teal-100/80">
              จัดการประกาศและติดตามสถิติของคุณ
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Plus size={16} />
            ลงประกาศใหม่
          </Link>
        </div>

        {/* Welcome Guide — แสดงเฉพาะ user ใหม่ที่ยังไม่มีประกาศ */}
        {(listingCount ?? 0) === 0 && (
          <div className="mb-8 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 to-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-slate-800">เริ่มต้นใช้งาน BanChangHub</h2>
            <p className="mb-5 text-xs text-slate-500">ทำตาม 4 ขั้นตอนง่ายๆ เพื่อเริ่มลงประกาศ</p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: 1,
                  title: "กรอกโปรไฟล์",
                  desc: "ใส่ชื่อ เบอร์โทร LINE ID เพื่อให้ลูกค้าติดต่อได้",
                  href: "/profile",
                  icon: User,
                  color: "from-teal-500 to-emerald-600",
                  done: !!(profile?.phone),
                },
                {
                  step: 2,
                  title: "ลงประกาศแรก",
                  desc: "เพิ่มทรัพย์สิน พร้อมรูปภาพและรายละเอียด",
                  href: "/listings/new",
                  icon: Plus,
                  color: "from-sky-500 to-blue-600",
                  done: (listingCount ?? 0) > 0,
                },
                {
                  step: 3,
                  title: "อัปโหลดรูป",
                  desc: "เพิ่มรูปทรัพย์สินให้น่าสนใจ มากกว่า 5 รูป",
                  href: "/dashboard/listings",
                  icon: Eye,
                  color: "from-amber-500 to-orange-600",
                  done: false,
                },
                {
                  step: 4,
                  title: "แชร์ประกาศ",
                  desc: "แชร์ลง Facebook, LINE กลุ่ม เพื่อเข้าถึงลูกค้า",
                  href: "/dashboard/listings",
                  icon: Heart,
                  color: "from-pink-500 to-rose-600",
                  done: false,
                },
              ].map((s) => (
                <Link
                  key={s.step}
                  href={s.href}
                  className={`group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md ${
                    s.done ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-white hover:border-teal-200"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white shadow-sm`}>
                      <s.icon size={16} />
                    </div>
                    {s.done ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">เสร็จแล้ว</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">ขั้นตอน {s.step}</span>
                    )}
                  </div>
                  <h3 className="mb-0.5 text-sm font-bold text-slate-800 group-hover:text-teal-700">{s.title}</h3>
                  <p className="text-[11px] text-slate-500">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${s.bgCard}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${s.color}`}
                >
                  <s.icon size={18} />
                </div>
                <TrendingUp size={14} className="text-slate-300" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Listings Table */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-slate-800">
                  ประกาศล่าสุด
                </h2>
                <Link
                  href="/dashboard/listings"
                  className="text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  ดูทั้งหมด
                </Link>
              </div>

              {!listings || listings.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                    <FileText size={24} className="text-slate-300" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-slate-600">
                    ยังไม่มีประกาศ
                  </p>
                  <p className="mb-4 text-xs text-slate-400">
                    เริ่มต้นลงประกาศทรัพย์สินของคุณวันนี้
                  </p>
                  <Link
                    href="/listings/new"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    <Plus size={14} />
                    ลงประกาศแรก
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {listings.map((listing) => {
                    const st = statusLabel[listing.status] ?? statusLabel.draft;
                    return (
                      <Link
                        key={listing.id}
                        href={`/listings/${listing.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Home size={18} className="text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {listing.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {listing.view_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart size={12} /> {listing.save_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />{" "}
                              {new Date(
                                listing.created_at
                              ).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}
                        >
                          {st.text}
                        </span>
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-slate-300"
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Calendar size={15} className="text-teal-600" />
                  นัดหมายถัดไป
                </h3>
                <Link
                  href="/dashboard/appointments"
                  className="text-[11px] font-medium text-teal-600 hover:text-teal-700"
                >
                  ดูทั้งหมด
                </Link>
              </div>

              {!upcomingAppointments || upcomingAppointments.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Calendar size={20} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-400">ยังไม่มีนัดหมาย</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingAppointments.map((apt) => {
                    const requester = apt.requester as {
                      full_name: string;
                      avatar_url: string;
                    } | null;
                    const listing = apt.listing as {
                      title: string;
                      listing_code: string;
                    } | null;
                    const isPending = apt.status === "pending";

                    return (
                      <Link
                        key={apt.id}
                        href="/dashboard/appointments"
                        className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
                          {requester?.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-700">
                            {requester?.full_name ?? "ผู้นัด"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {listing?.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Calendar size={10} />
                              {new Date(apt.scheduled_date).toLocaleDateString(
                                "th-TH",
                                { day: "numeric", month: "short" }
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Clock size={10} />
                              {(apt.scheduled_time as string).slice(0, 5)} น.
                            </span>
                            {isPending ? (
                              <span className="flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                                <AlertCircle size={9} />
                                รอยืนยัน
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                <CheckCircle2 size={9} />
                                ยืนยันแล้ว
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                เมนูลัด
              </h3>
              <div className="space-y-1">
                {[
                  {
                    label: "ลงประกาศใหม่",
                    href: "/listings/new",
                    icon: Plus,
                  },
                  {
                    label: "ตารางนัดหมาย",
                    href: "/dashboard/appointments",
                    icon: Calendar,
                  },
                  {
                    label: "แก้ไขโปรไฟล์",
                    href: "/profile",
                    icon: User,
                  },
                  {
                    label: "รายการโปรด",
                    href: "/dashboard/favorites",
                    icon: Heart,
                  },
                  {
                    label: "สถิติ",
                    href: "/dashboard/stats",
                    icon: BarChart3,
                  },
                  {
                    label: "แพ็กเกจ",
                    href: "/dashboard/packages",
                    icon: Package,
                  },
                  {
                    label: "สร้างสัญญา",
                    href: "/dashboard/contracts",
                    icon: FileText,
                  },
                  {
                    label: "เขียนบทความ",
                    href: "/dashboard/articles/new",
                    icon: FileText,
                  },
                  {
                    label: "ตั้งค่า",
                    href: "/dashboard/settings",
                    icon: Settings,
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#1e3a5f]"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Package Info */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-teal-700 p-5 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <Package size={16} className="text-teal-300" />
                <span className="text-sm font-bold">
                  แพ็กเกจฟรี
                </span>
              </div>
              <p className="mb-3 text-xs text-teal-100/70">
                ลงประกาศได้ 1 รายการ อัปเกรดเพื่อลงประกาศเพิ่ม
              </p>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-teal-300"
                  style={{
                    width: `${Math.min(((listingCount ?? 0) / 1) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mb-3 text-[11px] text-teal-200">
                ใช้ไป {listingCount ?? 0}/1 รายการ
              </p>
              <Link
                href="/dashboard/packages"
                className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/30"
              >
                อัปเกรดแพ็กเกจ
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
