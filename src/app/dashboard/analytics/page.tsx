import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  FileText,
  Calendar,
  Users,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all user's listings
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, view_count, save_count, contact_count, created_at")
    .eq("user_id", user.id)
    .order("view_count", { ascending: false });

  // Aggregate listing stats
  const totalListings = listings?.length ?? 0;
  const activeListings = listings?.filter((l) => l.status === "active").length ?? 0;
  const totalViews = listings?.reduce((s, l) => s + (l.view_count ?? 0), 0) ?? 0;
  const totalSaves = listings?.reduce((s, l) => s + (l.save_count ?? 0), 0) ?? 0;
  const totalContacts = listings?.reduce((s, l) => s + (l.contact_count ?? 0), 0) ?? 0;

  // Appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("agent_id", user.id);

  const appointmentCount = appointments?.length ?? 0;
  const completedAppointments = appointments?.filter((a) => a.status === "completed").length ?? 0;
  const appointmentRate = appointmentCount > 0 ? Math.round((completedAppointments / appointmentCount) * 100) : 0;

  // Wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance, lifetime_topup, lifetime_spent")
    .eq("user_id", user.id)
    .maybeSingle();

  // CRM Clients
  const { data: clients } = await supabase
    .from("clients")
    .select("status")
    .eq("agent_id", user.id);

  const totalClients = clients?.length ?? 0;
  const hotClients = clients?.filter((c) => c.status === "hot").length ?? 0;
  const closedClients = clients?.filter((c) => c.status === "closed").length ?? 0;
  const conversionRate = totalClients > 0 ? Math.round((closedClients / totalClients) * 100) : 0;

  // Co-agents count
  const { count: coAgentCount } = await supabase
    .from("co_agents")
    .select("*", { count: "exact", head: true })
    .eq("primary_agent_id", user.id)
    .eq("status", "active");

  // Conversion rate (contacts to views)
  const contactToViewRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <BarChart3 size={24} className="text-teal-600" />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">ภาพรวมประสิทธิภาพการทำงาน</p>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "ประกาศ Active", value: activeListings, total: totalListings, icon: FileText, cls: "text-blue-600 bg-blue-50" },
          { label: "ยอดเข้าชม", value: totalViews, icon: Eye, cls: "text-teal-600 bg-teal-50" },
          { label: "ติดต่อ", value: totalContacts, icon: MessageCircle, cls: "text-amber-600 bg-amber-50" },
          { label: "ลูกค้า CRM", value: totalClients, icon: Users, cls: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.cls}`}>
              <s.icon size={16} />
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">
              {s.label}
              {s.total !== undefined && ` / ${s.total}`}
            </p>
          </div>
        ))}
      </div>

      {/* Performance Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Conversion Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">อัตราการติดต่อ</p>
            <Target size={16} className="text-teal-500" />
          </div>
          <p className="text-3xl font-extrabold text-teal-600">{contactToViewRate}%</p>
          <p className="mt-1 text-xs text-slate-500">ติดต่อ / ยอดเข้าชม</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, Number(contactToViewRate))}%` }} />
          </div>
        </div>

        {/* Appointment Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">นัดหมายสำเร็จ</p>
            <Calendar size={16} className="text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold text-purple-600">{appointmentRate}%</p>
          <p className="mt-1 text-xs text-slate-500">{completedAppointments} / {appointmentCount} นัดหมาย</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${appointmentRate}%` }} />
          </div>
        </div>

        {/* Client Conversion */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">ปิดการขาย</p>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-3xl font-extrabold text-green-600">{conversionRate}%</p>
          <p className="mt-1 text-xs text-slate-500">{closedClients} / {totalClients} ลูกค้า (Hot: {hotClients})</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wallet Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Wallet size={16} className="text-teal-600" />
            สรุปเครดิต
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">คงเหลือ</span>
              <span className="text-lg font-bold text-slate-800">
                ฿{Number(wallet?.balance ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-green-600">
                <ArrowDownRight size={12} /> เติมทั้งหมด
              </span>
              <span className="text-sm font-medium text-green-600">
                ฿{Number(wallet?.lifetime_topup ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-red-600">
                <ArrowUpRight size={12} /> ใช้ทั้งหมด
              </span>
              <span className="text-sm font-medium text-red-600">
                ฿{Number(wallet?.lifetime_spent ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/wallet"
            className="mt-4 block w-full rounded-lg border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            ดูรายละเอียด
          </Link>
        </div>

        {/* Team Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users size={16} className="text-blue-600" />
            ทีมงาน
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Co-Agent ที่ active</span>
              <span className="text-lg font-bold text-slate-800">{coAgentCount ?? 0} คน</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">บันทึก Favorites</span>
              <span className="text-sm font-medium text-slate-600">{totalSaves}</span>
            </div>
          </div>
          <Link
            href="/dashboard/team"
            className="mt-4 block w-full rounded-lg border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            จัดการทีม
          </Link>
        </div>
      </div>

      {/* Top Listings */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">ประกาศยอดนิยม (Top 10)</h2>
        </div>
        {!listings || listings.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-400">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {listings.slice(0, 10).map((l, i) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{l.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Eye size={12} /> {l.view_count ?? 0}</span>
                  <span className="flex items-center gap-1"><Heart size={12} /> {l.save_count ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} /> {l.contact_count ?? 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
