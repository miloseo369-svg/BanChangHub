import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import TopupClient from "./topup-client";

export default async function TopupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user already has pending topup
  const { data: existingTopup } = await supabase
    .from("topup_requests")
    .select("id, amount, status, expires_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch current balance
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/dashboard/wallet"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} />
          กลับกระเป๋าเครดิต
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Wallet size={24} className="text-teal-600" />
          เติมเครดิต
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ยอดคงเหลือ: ฿{Number(wallet?.balance ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="mx-auto max-w-md">
        <TopupClient
          existingTopupId={existingTopup?.id ?? null}
          existingAmount={existingTopup ? Number(existingTopup.amount) : null}
        />
      </div>
    </div>
  );
}
