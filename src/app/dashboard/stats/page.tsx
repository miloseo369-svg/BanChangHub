import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  FileText,
  Calendar,
  Users,
} from "lucide-react";

export default async function StatsPage() {
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

  // Aggregate stats
  const totalListings = listings?.length ?? 0;
  const activeListings = listings?.filter((l) => l.status === "active").length ?? 0;
  const totalViews = listings?.reduce((s, l) => s + (l.view_count ?? 0), 0) ?? 0;
  const totalSaves = listings?.reduce((s, l) => s + (l.save_count ?? 0), 0) ?? 0;
  const totalContacts = listings?.reduce((s, l) => s + (l.contact_count ?? 0), 0) ?? 0;

  // Appointments count
  const { count: appointmentCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", user.id);

  const stats = [
    { label: "ประกาศทั้งหมด", value: totalListings, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "ประกาศ Active", value: activeListings, icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "ยอดเข้าชมรวม", value: totalViews, icon: Eye, color: "bg-teal-50 text-teal-600" },
    { label: "บันทึกรวม", value: totalSaves, icon: Heart, color: "bg-pink-50 text-pink-600" },
    { label: "ติดต่อรวม", value: totalContacts, icon: MessageCircle, color: "bg-amber-50 text-amber-600" },
    { label: "นัดหมายทั้งหมด", value: appointmentCount ?? 0, icon: Calendar, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700"><ArrowLeft size={18} /></Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]"><Home size={16} className="text-white" /></div>
              <span className="text-xl font-extrabold"><span className="text-[#1e3a5f]">BanChang</span><span className="text-teal-600">Hub</span></span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">สถิติ</h1>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon size={18} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{s.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top Listings */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">ประกาศยอดนิยม</h2>
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
