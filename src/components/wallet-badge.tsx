"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Wallet } from "lucide-react";

export default function WalletBadge() {
  const [balance, setBalance] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBalance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setBalance(Number(data.balance));
      }
    }
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href="/dashboard/wallet"
      className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100"
    >
      <Wallet size={14} />
      <span>฿{balance.toLocaleString()}</span>
    </Link>
  );
}
