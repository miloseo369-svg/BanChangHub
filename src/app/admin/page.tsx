import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import {
  FileText,
  Users,
  Eye,
  MessageCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  // Counts
  const [
    { count: totalListings },
    { count: pendingListings },
    { count: activeListings },
    { count: totalUsers },
    { count: totalInquiries },
    { count: totalAppointments },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
  ]);

  // Recent pending listings
  const { data: pending } = await supabase
    .from("listings")
    .select("id, title, listing_code, created_at, profiles:user_id(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "ประกาศทั้งหมด", value: totalListings ?? 0, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "รอตรวจ", value: pendingListings ?? 0, icon: AlertCircle, color: "bg-yellow-50 text-yellow-600" },
    { label: "เผยแพร่", value: activeListings ?? 0, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "ผู้ใช้", value: totalUsers ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Inquiries", value: totalInquiries ?? 0, icon: MessageCircle, color: "bg-teal-50 text-teal-600" },
    { label: "นัดหมาย", value: totalAppointments ?? 0, icon: Calendar, color: "bg-pink-50 text-pink-600" },
  ];

  return (
    <div className="px-4 py-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-800">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Listings */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <AlertCircle size={16} className="text-yellow-500" />
              ประกาศรอตรวจ ({pendingListings ?? 0})
            </h2>
            <Link href="/admin/listings?status=pending" className="text-xs font-medium text-teal-600 hover:text-teal-700">
              ดูทั้งหมด
            </Link>
          </div>
          {!pending || pending.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-400">ไม่มีประกาศรอตรวจ</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/listings?id=${l.id}`}
                  className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-700">{l.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {(l.profiles as unknown as { full_name: string } | null)?.full_name ?? "ไม่ทราบ"} &middot; {l.listing_code}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {new Date(l.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users size={16} className="text-purple-500" />
              สมาชิกล่าสุด
            </h2>
            <Link href="/admin/users" className="text-xs font-medium text-teal-600 hover:text-teal-700">
              ดูทั้งหมด
            </Link>
          </div>
          {!recentUsers || recentUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-400">ยังไม่มีสมาชิก</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {(u.full_name ?? "?").charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">{u.full_name || "ไม่มีชื่อ"}</p>
                      <p className="text-[11px] text-slate-400">{u.role}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(u.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
