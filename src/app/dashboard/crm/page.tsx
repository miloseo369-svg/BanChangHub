import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Flame,
  Sun,
  Snowflake,
  CheckCircle2,
  User,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Flame; cls: string; bgCls: string }> = {
  hot: { label: "Hot", icon: Flame, cls: "text-red-600", bgCls: "bg-red-50 border-red-200" },
  warm: { label: "Warm", icon: Sun, cls: "text-amber-600", bgCls: "bg-amber-50 border-amber-200" },
  active: { label: "Active", icon: User, cls: "text-blue-600", bgCls: "bg-blue-50 border-blue-200" },
  cold: { label: "Cold", icon: Snowflake, cls: "text-slate-500", bgCls: "bg-slate-50 border-slate-200" },
  closed: { label: "Closed", icon: CheckCircle2, cls: "text-green-600", bgCls: "bg-green-50 border-green-200" },
};

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // หา primary agents ที่ฉันเป็น co-agent ให้
  const { data: myTeams } = await supabase
    .from("co_agents")
    .select("primary_agent_id")
    .eq("co_agent_id", user.id)
    .eq("status", "active");

  const agentIds = [user.id, ...(myTeams ?? []).map((t) => t.primary_agent_id)];

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .in("agent_id", agentIds)
    .order("updated_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: clients, count } = await query.limit(50);

  // Count by status (รวม co-agent's clients)
  const { data: statusCounts } = await supabase
    .from("clients")
    .select("status")
    .in("agent_id", agentIds);

  const counts: Record<string, number> = {};
  (statusCounts ?? []).forEach((c) => {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  });

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Users size={24} className="text-teal-600" />
          CRM — จัดการลูกค้า
        </h1>
        <Link
          href="/dashboard/crm/new"
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={16} />
          เพิ่มลูกค้า
        </Link>
      </div>

      {/* Pipeline Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = params.status === key;
          return (
            <Link
              key={key}
              href={params.status === key ? "/dashboard/crm" : `/dashboard/crm?status=${key}`}
              className={`rounded-xl border p-3 text-center transition-all ${
                isActive
                  ? `${config.bgCls} ring-2 ring-offset-1`
                  : "border-slate-200 bg-white hover:shadow-sm"
              }`}
            >
              <Icon size={20} className={`mx-auto mb-1 ${config.cls}`} />
              <p className={`text-lg font-bold ${config.cls}`}>{counts[key] ?? 0}</p>
              <p className="text-[11px] text-slate-500">{config.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Client List */}
      {!clients || clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
          <Users size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ยังไม่มีลูกค้า</p>
          <Link href="/dashboard/crm/new" className="mt-2 inline-block text-sm font-medium text-teal-600 hover:underline">
            เพิ่มลูกค้าใหม่
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">ลูกค้า</th>
                  <th className="px-4 py-3 font-medium">ติดต่อ</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">งบประมาณ</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">แหล่งที่มา</th>
                  <th className="px-4 py-3 font-medium">อัปเดต</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => {
                  const st = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
                  const StIcon = st.icon;
                  const sourceLabel: Record<string, string> = {
                    website: "เว็บไซต์",
                    line: "LINE",
                    referral: "แนะนำ",
                    "walk-in": "Walk-in",
                    facebook: "Facebook",
                    other: "อื่นๆ",
                  };
                  return (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/crm/${client.id}`} className="hover:text-teal-600">
                          <p className="font-medium text-slate-800">{client.name}</p>
                          {client.notes && (
                            <p className="max-w-xs truncate text-[11px] text-slate-400">{client.notes}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {client.phone && (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                              <Phone size={10} /> {client.phone}
                            </span>
                          )}
                          {client.line_id && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MessageCircle size={10} /> {client.line_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.bgCls} ${st.cls}`}>
                          <StIcon size={10} />
                          {st.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-600 sm:table-cell">
                        {client.budget_min || client.budget_max ? (
                          <span>
                            {client.budget_min ? `฿${Number(client.budget_min).toLocaleString()}` : "-"}
                            {" - "}
                            {client.budget_max ? `฿${Number(client.budget_max).toLocaleString()}` : "-"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell">
                        {client.source ? sourceLabel[client.source] ?? client.source : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(client.updated_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
