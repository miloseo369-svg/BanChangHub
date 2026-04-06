"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export default function AdminPaymentActions({
  paymentId,
  status,
}: {
  paymentId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleConfirm() {
    setLoading(true);
    const { error } = await supabase.rpc("confirm_payment", {
      payment_id: paymentId,
    });

    if (error) {
      alert("ยืนยันไม่สำเร็จ: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReject() {
    if (!window.confirm("ปฏิเสธการชำระเงินนี้?")) return;
    setLoading(true);

    const { error } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", paymentId);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  if (status !== "pending") return null;

  return (
    <div className="flex gap-1">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
        title="ยืนยันชำระ"
      >
        <Check size={14} />
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
        title="ปฏิเสธ"
      >
        <X size={14} />
      </button>
    </div>
  );
}
