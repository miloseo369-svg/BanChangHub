"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Home, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4">
        <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-teal-500" />
          <h2 className="mb-2 text-xl font-bold text-slate-800">
            ส่งลิงก์แล้ว!
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่{" "}
            <strong className="text-slate-700">{email}</strong>{" "}
            กรุณาตรวจสอบกล่องขาเข้าและ spam
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            กลับหน้าเข้าสู่ระบบ
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
            <Home size={16} className="text-white" />
          </div>
          <span className="text-xl font-extrabold">
            <span className="text-[#1e3a5f]">BanChang</span>
            <span className="text-teal-600">Hub</span>
          </span>
        </Link>

        <h1 className="mb-1 text-2xl font-extrabold text-slate-800">
          ลืมรหัสผ่าน
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              อีเมล
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700"
          >
            <ArrowLeft size={14} />
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
