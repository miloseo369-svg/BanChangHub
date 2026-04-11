import { requireAdmin } from "@/lib/admin";
import { Users, ShieldCheck, Search, Crown } from "lucide-react";
import AdminUserActions from "./actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const { supabase, role: currentUserRole } = await requireAdmin();

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.ilike("full_name", `%${params.q}%`);
  }
  if (params.role) {
    query = query.eq("role", params.role);
  }

  const { data: users, count } = await query.limit(50);

  const roleLabel: Record<string, { text: string; cls: string }> = {
    user: { text: "ผู้ใช้", cls: "bg-slate-100 text-slate-600" },
    agent: { text: "ตัวแทน", cls: "bg-blue-100 text-blue-600" },
    contractor: { text: "ผู้รับเหมา", cls: "bg-teal-100 text-teal-600" },
    admin: { text: "แอดมิน", cls: "bg-red-100 text-red-600" },
    super_admin: { text: "Super Admin", cls: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800">จัดการผู้ใช้</h1>
        <span className="text-sm text-slate-500">{count ?? 0} คน</span>
      </div>

      {/* Search */}
      <form action="/admin/users" className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="ค้นหาชื่อ..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <select
          name="role"
          defaultValue={params.role}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
        >
          <option value="">ทุก Role</option>
          <option value="user">ผู้ใช้</option>
          <option value="agent">ตัวแทน</option>
          <option value="contractor">ผู้รับเหมา</option>
          <option value="admin">แอดมิน</option>
          {currentUserRole === "super_admin" && (
            <option value="super_admin">Super Admin</option>
          )}
        </select>
        <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          ค้นหา
        </button>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">ผู้ใช้</th>
                <th className="px-4 py-3 font-medium">เบอร์โทร</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">ยืนยัน</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">สมัครเมื่อ</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(users ?? []).map((u) => {
                const rl = roleLabel[u.role] ?? roleLabel.user;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                          {(u.full_name ?? "?").charAt(0)}
                        </div>
                        <div>
                          <p className="flex items-center gap-1 font-medium text-slate-800">
                            {u.full_name || "ไม่มีชื่อ"}
                            {u.role === "super_admin" && (
                              <Crown size={12} className="text-amber-500" />
                            )}
                          </p>
                          {u.company_name && <p className="text-[11px] text-slate-400">{u.company_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${rl.cls}`}>{rl.text}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_verified ? (
                        <ShieldCheck size={16} className="text-teal-500" />
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <AdminUserActions
                        userId={u.id}
                        role={u.role}
                        isVerified={u.is_verified}
                        currentUserRole={currentUserRole}
                      />
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
