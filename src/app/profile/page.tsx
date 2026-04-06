"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MessageCircle,
  FileText,
  Save,
  LogOut,
  ShieldCheck,
  Camera,
} from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: string;
  company_name: string;
  line_id: string;
  bio: string;
  is_verified: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    company_name: "",
    line_id: "",
    bio: "",
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          company_name: data.company_name ?? "",
          line_id: data.line_id ?? "",
          bio: data.bio ?? "",
        });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        company_name: form.company_name || null,
        line_id: form.line_id || null,
        bio: form.bio || null,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    user: "ผู้ใช้งาน",
    agent: "ตัวแทน",
    contractor: "ผู้รับเหมา",
    admin: "ผู้ดูแลระบบ",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="text-sm text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-700"
            >
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
          <span className="text-sm text-slate-500">โปรไฟล์</span>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Avatar & Name */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-700">
              {form.full_name?.charAt(0) || "?"}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-500 hover:bg-slate-200">
              <Camera size={12} />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              {form.full_name || "ผู้ใช้งาน"}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
              <span>{roleLabel[profile?.role ?? "user"]}</span>
              {profile?.is_verified && (
                <span className="flex items-center gap-1 text-teal-600">
                  <ShieldCheck size={13} />
                  ยืนยันแล้ว
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            บันทึกข้อมูลสำเร็จ
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-800">
              ข้อมูลส่วนตัว
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  ชื่อ-นามสกุล
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => updateForm("full_name", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                </div>
              </div>

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
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-800">
              ข้อมูลธุรกิจ
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  ชื่อบริษัท/ร้าน
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => updateForm("company_name", e.target.value)}
                    placeholder="ชื่อบริษัท (ถ้ามี)"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  LINE ID
                </label>
                <div className="relative">
                  <MessageCircle
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.line_id}
                    onChange={(e) => updateForm("line_id", e.target.value)}
                    placeholder="@line_id"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  แนะนำตัว
                </label>
                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <textarea
                    value={form.bio}
                    onChange={(e) => updateForm("bio", e.target.value)}
                    rows={3}
                    placeholder="บอกเล่าเกี่ยวกับตัวคุณหรือธุรกิจของคุณ..."
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              ออกจากระบบ
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              {!saving && <Save size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
