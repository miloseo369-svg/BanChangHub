import { requireAdmin } from "@/lib/admin";
import { CreditCard, Clock, CheckCircle2, XCircle } from "lucide-react";
import AdminPaymentActions from "./actions";

export default async function AdminPaymentsPage() {
  const { supabase } = await requireAdmin();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles:user_id(full_name, phone), packages:package_id(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const statusConfig: Record<string, { text: string; cls: string }> = {
    pending: { text: "รอยืนยัน", cls: "bg-yellow-100 text-yellow-700" },
    confirmed: { text: "ยืนยันแล้ว", cls: "bg-green-100 text-green-700" },
    rejected: { text: "ปฏิเสธ", cls: "bg-red-100 text-red-600" },
    expired: { text: "หมดอายุ", cls: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-800">การชำระเงิน</h1>

      {!payments || payments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <CreditCard size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ยังไม่มีรายการชำระเงิน</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">ผู้ชำระ</th>
                  <th className="px-4 py-3 font-medium">แพ็กเกจ</th>
                  <th className="px-4 py-3 font-medium">จำนวน</th>
                  <th className="px-4 py-3 font-medium">สลิป</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">วันที่</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const user = p.profiles as unknown as { full_name: string; phone: string } | null;
                  const pkg = p.packages as unknown as { name: string } | null;
                  const st = statusConfig[p.status] ?? statusConfig.pending;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-700">{user?.full_name ?? "-"}</p>
                        <p className="text-[11px] text-slate-400">{user?.phone ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{pkg?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                        ฿{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {p.slip_url ? (
                          <a
                            href={p.slip_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-teal-600 underline hover:text-teal-700"
                          >
                            ดูสลิป
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">ยังไม่อัปโหลด</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-400 sm:table-cell">
                        {new Date(p.created_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <AdminPaymentActions paymentId={p.id} status={p.status} />
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
