"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { MoreVertical, ShieldCheck, ShieldOff, UserX, Eye } from "lucide-react";

export default function AgentActions({
  agentId,
  isVerified,
}: {
  agentId: string;
  isVerified: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggleVerify() {
    setLoading(true);
    setShowMenu(false);
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !isVerified })
      .eq("id", agentId);
    if (error) alert("อัปเดตไม่สำเร็จ: " + error.message);
    else router.refresh();
    setLoading(false);
  }

  async function demoteToUser() {
    if (!window.confirm("ลดสิทธิ์เป็นผู้ใช้ทั่วไป?")) return;
    setLoading(true);
    setShowMenu(false);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "user", is_verified: false })
      .eq("id", agentId);
    if (error) alert("อัปเดตไม่สำเร็จ: " + error.message);
    else router.refresh();
    setLoading(false);
  }

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
            <button
              onClick={toggleVerify}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              {isVerified ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
              {isVerified ? "ยกเลิกยืนยัน" : "ยืนยันตัวตน"}
            </button>
            <a
              href={`/admin/users`}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Eye size={13} /> ดูข้อมูลเต็ม
            </a>
            <button
              onClick={demoteToUser}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              <UserX size={13} /> ลดสิทธิ์เป็นผู้ใช้
            </button>
          </div>
        </>
      )}
    </div>
  );
}
