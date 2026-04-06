"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-800">เข้าสู่ระบบ</h1>
      <p className="mb-6 text-sm text-slate-500">ยินดีต้อนรับกลับ เข้าสู่ระบบเพื่อจัดการประกาศของคุณ</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">รหัสผ่าน</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="rounded border-slate-300" />
            จดจำฉัน
          </label>
          <Link href="/forgot-password" className="font-medium text-teal-600 hover:text-teal-700">ลืมรหัสผ่าน?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700">
          สมัครสมาชิก
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left — Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
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

          <Suspense fallback={<div className="py-8 text-center text-sm text-slate-400">กำลังโหลด...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Right — Branding */}
      <div className="hidden flex-col justify-center bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] px-12 lg:flex lg:w-[45%]">
        <div className="max-w-md">
          <h2 className="mb-4 text-3xl font-extrabold text-white">
            จัดการทรัพย์สินของคุณ
            <br />
            <span className="text-teal-300">ง่ายและสะดวก</span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-300">
            ลงประกาศขายบ้าน เซ้งกิจการ หรือหาช่างรับเหมา ทุกอย่างจบในที่เดียว
            เข้าถึงลูกค้ากว่า 2,500 รายทั่วอีสานตอนบน
          </p>
          <div className="space-y-3">
            {["ลงประกาศฟรี 1 รายการ", "ระบบจัดการประกาศง่ายใช้", "แจ้งเตือนเมื่อมีคนสนใจ"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-300">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
