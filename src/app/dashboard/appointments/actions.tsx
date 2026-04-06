"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Check, X, MoreVertical } from "lucide-react";

export default function AppointmentActions({
  appointmentId,
  status,
  isAgent,
}: {
  appointmentId: string;
  status: string;
  isAgent: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setShowMenu(false);

    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === "cancelled") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        updates.cancelled_by = user.id;
      }
    }

    const { error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointmentId);

    if (!error) {
      router.refresh();
    }
    setLoading(false);
  }

  if (status === "cancelled" || status === "completed") {
    return null;
  }

  return (
    <div className="relative">
      {status === "pending" && isAgent ? (
        <div className="flex gap-1">
          <button
            onClick={() => updateStatus("confirmed")}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50"
            title="ยืนยันนัด"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => updateStatus("cancelled")}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
            title="ปฏิเสธ"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50"
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-9 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {isAgent && status === "confirmed" && (
                  <button
                    onClick={() => updateStatus("completed")}
                    disabled={loading}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Check size={13} />
                    เสร็จสิ้น
                  </button>
                )}
                <button
                  onClick={() => updateStatus("cancelled")}
                  disabled={loading}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  <X size={13} />
                  ยกเลิกนัด
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
