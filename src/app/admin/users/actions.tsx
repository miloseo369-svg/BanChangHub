"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { MoreVertical, ShieldCheck, ShieldOff, UserCog } from "lucide-react";

export default function AdminUserActions({
  userId,
  role,
  isVerified,
  currentUserRole,
}: {
  userId: string;
  role: string;
  isVerified: boolean;
  currentUserRole: "admin" | "super_admin";
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isSuperAdmin = currentUserRole === "super_admin";

  async function handleToggleVerify() {
    setLoading(true);
    setShowMenu(false);

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !isVerified })
      .eq("id", userId);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      // Log activity
      await supabase.rpc("log_activity", {
        p_action: "user.verified",
        p_entity_type: "profile",
        p_entity_id: userId,
        p_metadata: { is_verified: !isVerified },
      });

      // แจ้งเตือน user
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "system",
        title: !isVerified ? "ยืนยันตัวตนสำเร็จ" : "สถานะยืนยันถูกยกเลิก",
        message: !isVerified
          ? "บัญชีของคุณได้รับการยืนยันตัวตนแล้ว"
          : "สถานะยืนยันตัวตนของคุณถูกยกเลิก",
        link: "/profile",
      });

      router.refresh();
    }
    setLoading(false);
  }

  async function handleChangeRole(newRole: string) {
    setLoading(true);
    setShowMenu(false);

    const { error } = await supabase.rpc("admin_update_role", {
      p_user_id: userId,
      p_new_role: newRole,
    });

    if (error) {
      alert("เปลี่ยน Role ไม่สำเร็จ: " + error.message);
    } else {
      const roleLabels: Record<string, string> = {
        user: "ผู้ใช้", agent: "ตัวแทน", contractor: "ผู้รับเหมา",
        admin: "แอดมิน", super_admin: "Super Admin",
      };

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "system",
        title: "Role ของคุณเปลี่ยนแล้ว",
        message: `Role ของคุณถูกเปลี่ยนเป็น "${roleLabels[newRole] ?? newRole}"`,
        link: "/dashboard",
      });

      router.refresh();
    }
    setLoading(false);
  }

  const roles = [
    { value: "user", label: "ผู้ใช้" },
    { value: "agent", label: "ตัวแทน" },
    { value: "contractor", label: "ผู้รับเหมา" },
    { value: "admin", label: "แอดมิน" },
    ...(isSuperAdmin
      ? [{ value: "super_admin", label: "Super Admin" }]
      : []),
  ];

  // admin ธรรมดาไม่สามารถจัดการ super_admin ได้
  if (role === "super_admin" && !isSuperAdmin) {
    return (
      <span className="text-[10px] text-amber-500">Super Admin</span>
    );
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
            {/* Toggle verify */}
            <button
              onClick={handleToggleVerify}
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
                  onClick={() => handleChangeRole(r.value)}
                  disabled={loading || role === r.value}
                  className={`flex w-full rounded-md px-2 py-1 text-xs ${
                    role === r.value
                      ? "font-semibold text-teal-600"
                      : r.value === "super_admin"
                        ? "text-amber-600 hover:bg-amber-50"
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
