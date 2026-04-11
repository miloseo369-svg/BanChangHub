import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  CreditCard,
} from "lucide-react";

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch pending topups
  const { data: pendingTopups } = await supabase
    .from("topup_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const balance = Number(wallet?.balance ?? 0);
  const lifetimeTopup = Number(wallet?.lifetime_topup ?? 0);
  const lifetimeSpent = Number(wallet?.lifetime_spent ?? 0);

  const typeIcon: Record<string, { icon: typeof ArrowUpRight; cls: string; label: string }> = {
    topup: { icon: ArrowDownLeft, cls: "text-green-600 bg-green-50", label: "เติมเครดิต" },
    spend: { icon: ArrowUpRight, cls: "text-red-600 bg-red-50", label: "ใช้เครดิต" },
    refund: { icon: ArrowDownLeft, cls: "text-blue-600 bg-blue-50", label: "คืนเครดิต" },
    admin_adjust: { icon: CreditCard, cls: "text-amber-600 bg-amber-50", label: "ปรับยอด" },
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Wallet size={24} className="text-teal-600" />
          กระเป๋าเครดิต
        </h1>
        <Link
          href="/dashboard/wallet/topup"
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={16} />
          เติมเครดิต
        </Link>
      </div>

      {/* Balance Card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-teal-700 p-6 text-white shadow-lg">
        <p className="mb-1 text-sm text-white/70">ยอดเครดิตคงเหลือ</p>
        <p className="mb-4 text-4xl font-extrabold">
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-white/60">เติมทั้งหมด</p>
            <p className="font-semibold">฿{lifetimeTopup.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60">ใช้ทั้งหมด</p>
            <p className="font-semibold">฿{lifetimeSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Pending Topups */}
      {pendingTopups && pendingTopups.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <Clock size={14} />
            รอยืนยัน ({pendingTopups.length})
          </h3>
          {pendingTopups.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-1 text-sm">
              <span className="text-amber-700">
                เติม ฿{Number(t.amount).toLocaleString()}
              </span>
              <span className="text-xs text-amber-500">
                {new Date(t.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <TrendingUp size={16} className="text-slate-400" />
            ประวัติธุรกรรม
          </h2>
        </div>

        {!transactions || transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Wallet size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-500">ยังไม่มีธุรกรรม</p>
            <Link href="/dashboard/wallet/topup" className="mt-2 inline-block text-sm font-medium text-teal-600 hover:underline">
              เติมเครดิตเลย
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map((tx) => {
              const info = typeIcon[tx.type] ?? typeIcon.topup;
              const Icon = info.icon;
              const isPositive = Number(tx.amount) > 0;

              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${info.cls}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {tx.description || info.label}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? "+" : ""}฿{Math.abs(Number(tx.amount)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      คงเหลือ ฿{Number(tx.balance_after).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
