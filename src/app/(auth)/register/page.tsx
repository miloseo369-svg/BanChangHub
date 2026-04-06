"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Home, Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4">
        <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-3xl">✉️</div>
          <h2 className="mb-2 text-xl font-bold text-slate-800">ตรวจสอบอีเมลของคุณ</h2>
          <p className="mb-6 text-sm text-slate-500">
            เราส่งลิงก์ยืนยันไปที่ <strong>{email}</strong> กดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
            ไปหน้าเข้าสู่ระบบ <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding */}
      <div className="hidden flex-col justify-center bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] px-12 lg:flex lg:w-[45%]">
        <div className="max-w-md">
          <h2 className="mb-4 text-3xl font-extrabold text-white">
            เริ่มต้นลงประกาศ
            <br />
            <span className="text-teal-300">วันนี้ ฟรี!</span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-300">
            สมัครสมาชิกเพื่อลงประกาศขายบ้าน เซ้งกิจการ หรือบริการรับเหมาของคุณ
            เข้าถึงลูกค้าทั่วอีสานตอนบน
          </p>
          <div className="space-y-3">
            {[
              "สมัครฟรี ไม่มีค่าใช้จ่าย",
              "ลงประกาศได้ทันทีหลังสมัคร",
              "ระบบจัดการประกาศใช้ง่าย",
              "แจ้งเตือนเมื่อมีคนสนใจ",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-300">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-xl font-extrabold">
              <span className="text-[#1e3a5f]">BanChang</span>
              <span className="text-teal-600">Hub</span>
            </span>
          </Link>

          <h1 className="mb-1 text-2xl font-extrabold text-slate-800">สมัครสมาชิก</h1>
          <p className="mb-6 text-sm text-slate-500">สร้างบัญชีเพื่อเริ่มลงประกาศทรัพย์สินของคุณ</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ชื่อ นามสกุล"
                  required
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทรศัพท์</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
            </div>

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
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
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
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            การสมัครสมาชิกถือว่าคุณยอมรับ{" "}
            <a href="/terms" className="text-teal-600 hover:underline">ข้อกำหนดการใช้งาน</a> และ{" "}
            <a href="/privacy" className="text-teal-600 hover:underline">นโยบายความเป็นส่วนตัว</a>
          </p>

          <p className="mt-4 text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
