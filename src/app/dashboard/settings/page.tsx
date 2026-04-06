"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Bell,
  Shield,
  Trash2,
  Lock,
  Save,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "คุณแน่ใจหรือไม่ที่จะลบบัญชี? การกระทำนี้ไม่สามารถย้อนกลับได้"
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "ยืนยันอีกครั้ง: ประกาศ รายการโปรด และข้อมูลทั้งหมดจะถูกลบถาวร"
    );
    if (!doubleConfirm) return;

    // เรียก DB function ลบ user จริง (cascade ลบข้อมูลทั้งหมด)
    const { error: deleteError } = await supabase.rpc("delete_own_account");

    if (deleteError) {
      setError("ลบบัญชีไม่สำเร็จ: " + deleteError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
                <Home size={16} className="text-white" />
              </div>
              <span className="text-xl font-extrabold">
                <span className="text-[#1e3a5f]">BanChang</span>
                <span className="text-teal-600">Hub</span>
              </span>
            </Link>
          </div>
          <span className="text-sm text-slate-500">ตั้งค่า</span>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">ตั้งค่า</h1>

        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Lock size={16} className="text-slate-400" />
              เปลี่ยนรหัสผ่าน
            </h2>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
            )}
            {success && (
              <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-600">{success}</div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกอีกครั้ง"
                  required
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                {!loading && <Save size={14} />}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700">
              <AlertTriangle size={16} />
              โซนอันตราย
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              การลบบัญชีจะลบประกาศ รายการโปรด และข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้
            </p>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={14} />
              ลบบัญชี
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
