import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ScrollText, Clock } from "lucide-react";
import LogFilters from "./log-filters";

const ACTION_LABELS: Record<string, { text: string; cls: string }> = {
  "user.role_changed": { text: "เปลี่ยน Role", cls: "bg-blue-100 text-blue-700" },
  "user.verified": { text: "ยืนยันตัวตน", cls: "bg-teal-100 text-teal-700" },
  "user.promoted_super_admin": { text: "Promote Super Admin", cls: "bg-amber-100 text-amber-700" },
  "listing.approved": { text: "อนุมัติประกาศ", cls: "bg-green-100 text-green-700" },
  "listing.rejected": { text: "ปฏิเสธประกาศ", cls: "bg-red-100 text-red-600" },
  "listing.status_changed": { text: "เปลี่ยนสถานะประกาศ", cls: "bg-slate-100 text-slate-700" },
  "payment.confirmed": { text: "ยืนยันชำระเงิน", cls: "bg-green-100 text-green-700" },
  "payment.rejected": { text: "ปฏิเสธชำระเงิน", cls: "bg-red-100 text-red-600" },
  "topup.confirmed": { text: "ยืนยันเติมเครดิต", cls: "bg-emerald-100 text-emerald-700" },
  "topup.rejected": { text: "ปฏิเสธเติมเครดิต", cls: "bg-red-100 text-red-600" },
  "co_agent.invited": { text: "เชิญ Co-Agent", cls: "bg-purple-100 text-purple-700" },
  "co_agent.revoked": { text: "ยกเลิก Co-Agent", cls: "bg-orange-100 text-orange-700" },
};

function formatMetadata(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case "user.role_changed":
      return `${metadata.old_role} → ${metadata.new_role}`;
    case "user.verified":
      return metadata.is_verified ? "ยืนยันแล้ว" : "ยกเลิกยืนยัน";
    case "payment.confirmed":
    case "topup.confirmed":
      return `฿${Number(metadata.amount).toLocaleString()} ${metadata.package ? `(${metadata.package})` : ""}`;
    case "listing.approved":
    case "listing.rejected":
    case "listing.status_changed":
      return metadata.listing_code
        ? String(metadata.listing_code)
        : metadata.new_status
          ? `→ ${metadata.new_status}`
          : "";
    default:
      return Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : "";
  }
}

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const { role, supabase } = await requireAdmin();

  // เฉพาะ super_admin ดู logs ได้
  if (role !== "super_admin") {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 30;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("activity_logs")
    .select("*, profiles:actor_id(full_name, role)", { count: "exact" });

  if (params.action) {
    query = query.eq("action", params.action);
  }

  const { data: logs, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText size={22} className="text-amber-600" />
          <h1 className="text-2xl font-extrabold text-slate-800">Activity Logs</h1>
        </div>
        <span className="text-sm text-slate-500">{count ?? 0} รายการ</span>
      </div>

      {/* Filters */}
      <LogFilters currentAction={params.action} />

      {/* Logs Table */}
      {!logs || logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <ScrollText size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ยังไม่มี Activity Log</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">เวลา</th>
                  <th className="px-4 py-3 font-medium">ผู้ทำ</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const actor = log.profiles as { full_name: string; role: string } | null;
                  const actionInfo = ACTION_LABELS[log.action] ?? {
                    text: log.action,
                    cls: "bg-slate-100 text-slate-600",
                  };
                  const detail = formatMetadata(log.action, (log.metadata ?? {}) as Record<string, unknown>);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(log.created_at).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {(actor?.full_name ?? "?").charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-slate-700">
                            {actor?.full_name ?? "System"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${actionInfo.cls}`}>
                          {actionInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {log.entity_type && (
                          <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                            {log.entity_type}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-600 sm:table-cell">
                        {detail && (
                          <span className="max-w-xs truncate">{detail}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => {
            const actionParam = params.action ? `&action=${params.action}` : "";
            return (
              <a
                key={p}
                href={`/admin/activity-logs?page=${p}${actionParam}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${
                  page === p ? "bg-amber-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
