import { requireAdmin } from "@/lib/admin";
import { Wallet, ExternalLink } from "lucide-react";
import AdminTopupActions from "./actions";

export default async function AdminTopupsPage() {
  const { supabase } = await requireAdmin();

  const { data: topups } = await supabase
    .from("topup_requests")
    .select("*, profiles:user_id(full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    pending: { text: "รอยืนยัน", cls: "bg-yellow-100 text-yellow-700" },
    confirmed: { text: "ยืนยันแล้ว", cls: "bg-green-100 text-green-700" },
    rejected: { text: "ปฏิเสธ", cls: "bg-red-100 text-red-600" },
    expired: { text: "หมดอายุ", cls: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Wallet size={22} className="text-teal-600" />
          จัดการเติมเครดิต
        </h1>
        <span className="text-sm text-slate-500">{topups?.length ?? 0} รายการ</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">ผู้เติม</th>
                <th className="px-4 py-3 font-medium">จำนวน</th>
                <th className="px-4 py-3 font-medium">สลิป</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">วันที่</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(topups ?? []).map((t) => {
                const user = t.profiles as { full_name: string; phone: string } | null;
                const st = statusLabel[t.status] ?? statusLabel.pending;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-700">{user?.full_name ?? "-"}</p>
                      <p className="text-[11px] text-slate-400">{user?.phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">
                      ฿{Number(t.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {t.slip_url ? (
                        <a
                          href={t.slip_url}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline"
                        >
                          ดูสลิป <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                        {st.text}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 sm:table-cell">
                      {new Date(t.created_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <AdminTopupActions topupId={t.id} status={t.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
