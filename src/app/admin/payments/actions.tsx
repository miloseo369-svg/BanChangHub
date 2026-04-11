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

    // ดึงข้อมูล payment ก่อน
    const { data: payment } = await supabase
      .from("payments")
      .select("user_id, amount, packages:package_id(name)")
      .eq("id", paymentId)
      .single();

    const { error } = await supabase.rpc("confirm_payment", {
      payment_id: paymentId,
    });

    if (error) {
      alert("ยืนยันไม่สำเร็จ: " + error.message);
    } else {
      // แจ้งเตือน user
      if (payment) {
        const pkg = payment.packages as unknown as { name: string } | null;
        await supabase.from("notifications").insert({
          user_id: payment.user_id,
          type: "payment_confirmed",
          title: "ชำระเงินสำเร็จ",
          message: `แพ็กเกจ ${pkg?.name ?? ""} เปิดใช้งานแล้ว`,
          link: "/dashboard/packages",
        });
      }
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReject() {
    if (!window.confirm("ปฏิเสธการชำระเงินนี้?")) return;
    setLoading(true);

    // ดึงข้อมูล payment ก่อน
    const { data: payment } = await supabase
      .from("payments")
      .select("user_id, amount")
      .eq("id", paymentId)
      .single();

    const { error } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", paymentId);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      await supabase.rpc("log_activity", {
        p_action: "payment.rejected",
        p_entity_type: "payment",
        p_entity_id: paymentId,
        p_metadata: { amount: payment?.amount },
      });

      // แจ้งเตือน user
      if (payment) {
        await supabase.from("notifications").insert({
          user_id: payment.user_id,
          type: "system",
          title: "การชำระเงินถูกปฏิเสธ",
          message: `การชำระเงิน ฿${Number(payment.amount).toLocaleString()} ถูกปฏิเสธ กรุณาตรวจสอบ`,
          link: "/dashboard/packages",
        });
      }
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
