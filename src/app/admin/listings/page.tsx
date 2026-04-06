import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { Eye, Clock, ChevronRight, FileText } from "lucide-react";
import AdminListingActions from "./actions";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const statusFilter = params.status ?? "all";
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("listings")
    .select("*, profiles:user_id(full_name, phone)", { count: "exact" });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: listings, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  const statusTabs = [
    { key: "all", label: "ทั้งหมด" },
    { key: "pending", label: "รอตรวจ" },
    { key: "active", label: "เผยแพร่" },
    { key: "draft", label: "แบบร่าง" },
    { key: "rejected", label: "ปฏิเสธ" },
    { key: "sold", label: "ขายแล้ว" },
    { key: "expired", label: "หมดอายุ" },
  ];

  const statusLabel: Record<string, { text: string; cls: string }> = {
    draft: { text: "แบบร่าง", cls: "bg-slate-100 text-slate-600" },
    pending: { text: "รอตรวจ", cls: "bg-yellow-100 text-yellow-700" },
    active: { text: "เผยแพร่", cls: "bg-green-100 text-green-700" },
    sold: { text: "ขายแล้ว", cls: "bg-blue-100 text-blue-600" },
    expired: { text: "หมดอายุ", cls: "bg-red-100 text-red-600" },
    rejected: { text: "ปฏิเสธ", cls: "bg-red-100 text-red-600" },
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800">จัดการประกาศ</h1>
        <span className="text-sm text-slate-500">{count ?? 0} รายการ</span>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {statusTabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/listings${t.key === "all" ? "" : `?status=${t.key}`}`}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === t.key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {!listings || listings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <FileText size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ไม่มีประกาศ</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">ประกาศ</th>
                  <th className="px-4 py-3 font-medium">ผู้ลง</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">ราคา</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">วันที่</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((l) => {
                  const st = statusLabel[l.status] ?? statusLabel.draft;
                  const owner = l.profiles as { full_name: string; phone: string } | null;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/listings/${l.id}`} className="hover:text-teal-600">
                          <p className="max-w-xs truncate font-medium text-slate-800">{l.title}</p>
                          <p className="text-[11px] text-slate-400">{l.listing_code}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{owner?.full_name ?? "-"}</p>
                        <p className="text-[11px] text-slate-400">{owner?.phone ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                        {l.price ? `฿${Number(l.price).toLocaleString()}` : "-"}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-400 sm:table-cell">
                        {new Date(l.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <AdminListingActions listingId={l.id} status={l.status} />
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
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/listings?status=${statusFilter}&page=${p}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${
                page === p ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
