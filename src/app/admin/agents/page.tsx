import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { Users, ShieldCheck, Eye, FileText, Phone, Building2, Star, MapPin } from "lucide-react";
import AgentActions from "./actions";

export default async function AdminAgentsPage() {
  const { supabase } = await requireAdmin();

  // ดึง users ที่เป็น agent หรือ contractor
  const { data: agents } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["agent", "contractor"])
    .order("created_at", { ascending: false });

  // ดึงจำนวนประกาศและยอดวิวของแต่ละ agent
  const agentIds = (agents ?? []).map((a) => a.id);
  const { data: listingStats } = agentIds.length > 0
    ? await supabase
        .from("listings")
        .select("user_id, id, view_count, status")
        .in("user_id", agentIds)
    : { data: [] };

  // Aggregate
  const statsMap: Record<string, { total: number; active: number; views: number }> = {};
  for (const l of listingStats ?? []) {
    if (!statsMap[l.user_id]) statsMap[l.user_id] = { total: 0, active: 0, views: 0 };
    statsMap[l.user_id].total++;
    if (l.status === "active") statsMap[l.user_id].active++;
    statsMap[l.user_id].views += l.view_count ?? 0;
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">ตัวแทน & ผู้รับเหมา</h1>
          <p className="mt-1 text-sm text-slate-500">{agents?.length ?? 0} คน</p>
        </div>
      </div>

      {!agents || agents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <Users size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="mb-1 text-sm font-medium text-slate-600">ยังไม่มีตัวแทน</p>
          <p className="text-xs text-slate-400">เมื่อ admin เปลี่ยน role ผู้ใช้เป็น &quot;ตัวแทน&quot; หรือ &quot;ผู้รับเหมา&quot; จะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const st = statsMap[agent.id] ?? { total: 0, active: 0, views: 0 };
            return (
              <div
                key={agent.id}
                className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  agent.is_verified ? "border-teal-200" : "border-slate-200"
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-lg font-bold text-white">
                        {(agent.full_name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-800">{agent.full_name || "ไม่มีชื่อ"}</h3>
                          {agent.is_verified && <ShieldCheck size={14} className="text-teal-500" />}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          agent.role === "agent" ? "bg-blue-100 text-blue-600" : "bg-teal-100 text-teal-600"
                        }`}>
                          {agent.role === "agent" ? "ตัวแทน" : "ผู้รับเหมา"}
                        </span>
                      </div>
                    </div>
                    <AgentActions agentId={agent.id} isVerified={agent.is_verified} />
                  </div>

                  {/* Info */}
                  <div className="mb-4 space-y-1.5 text-xs text-slate-500">
                    {agent.phone && (
                      <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {agent.phone}</p>
                    )}
                    {agent.company_name && (
                      <p className="flex items-center gap-1.5"><Building2 size={12} className="text-slate-400" /> {agent.company_name}</p>
                    )}
                    {agent.line_id && (
                      <p className="flex items-center gap-1.5"><span className="text-[10px] text-slate-400">LINE</span> {agent.line_id}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                    <div className="text-center">
                      <p className="text-lg font-extrabold text-slate-800">{st.total}</p>
                      <p className="text-[10px] text-slate-400">ประกาศ</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-extrabold text-green-600">{st.active}</p>
                      <p className="text-[10px] text-slate-400">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-extrabold text-teal-600">{st.views.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">ยอดวิว</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {agent.bio && (
                    <p className="mt-3 line-clamp-2 text-[11px] text-slate-500">{agent.bio}</p>
                  )}

                  {/* Joined */}
                  <p className="mt-3 text-[10px] text-slate-400">
                    สมัครเมื่อ {new Date(agent.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
