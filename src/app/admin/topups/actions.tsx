"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export default function AdminTopupActions({
  topupId,
  status,
}: {
  topupId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleConfirm() {
    setLoading(true);
    const { error } = await supabase.rpc("confirm_topup", {
      p_topup_id: topupId,
    });

    if (error) {
      alert("ยืนยันไม่สำเร็จ: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReject() {
    if (!window.confirm("ปฏิเสธการเติมเครดิตนี้?")) return;
    setLoading(true);

    const { error } = await supabase
      .from("topup_requests")
      .update({ status: "rejected" })
      .eq("id", topupId);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      await supabase.rpc("log_activity", {
        p_action: "topup.rejected",
        p_entity_type: "topup_request",
        p_entity_id: topupId,
        p_metadata: {},
      });
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
        title="ยืนยันเติมเครดิต"
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
