"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { MoreVertical, ShieldCheck, ShieldOff, UserCog } from "lucide-react";

export default function AdminUserActions({
  userId,
  role,
  isVerified,
}: {
  userId: string;
  role: string;
  isVerified: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function updateProfile(updates: Record<string, unknown>) {
    // ป้องกัน admin ลด role ตัวเอง
    if (updates.role && updates.role !== "admin") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId) {
        alert("ไม่สามารถลด Role ของตัวเองได้");
        return;
      }
    }

    setLoading(true);
    setShowMenu(false);

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  const roles = [
    { value: "user", label: "ผู้ใช้" },
    { value: "agent", label: "ตัวแทน" },
    { value: "contractor", label: "ผู้รับเหมา" },
    { value: "admin", label: "แอดมิน" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50"
      >
        <MoreVertical size={14} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {/* Toggle verify */}
            <button
              onClick={() => updateProfile({ is_verified: !isVerified })}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              {isVerified ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
              {isVerified ? "ยกเลิกยืนยัน" : "ยืนยันตัวตน"}
            </button>

            {/* Change role */}
            <div className="border-t border-slate-100 px-3 py-2">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <UserCog size={11} /> เปลี่ยน Role
              </p>
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => updateProfile({ role: r.value })}
                  disabled={loading || role === r.value}
                  className={`flex w-full rounded-md px-2 py-1 text-xs ${
                    role === r.value
                      ? "font-semibold text-teal-600"
                      : "text-slate-600 hover:bg-slate-50"
                  } disabled:opacity-50`}
                >
                  {r.label} {role === r.value && " (ปัจจุบัน)"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
