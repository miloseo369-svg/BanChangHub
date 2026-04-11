"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";

export default function NewClientPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const budgetMin = form.get("budget_min") ? Number(form.get("budget_min")) : null;
    const budgetMax = form.get("budget_max") ? Number(form.get("budget_max")) : null;

    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      setError("งบขั้นต่ำต้องไม่มากกว่างบสูงสุด");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("clients").insert({
      agent_id: user.id,
      name: form.get("name") as string,
      phone: (form.get("phone") as string) || null,
      email: (form.get("email") as string) || null,
      line_id: (form.get("line_id") as string) || null,
      budget_min: budgetMin,
      budget_max: budgetMax,
      status: form.get("status") as string,
      source: (form.get("source") as string) || null,
      notes: (form.get("notes") as string) || null,
    });

    if (insertError) {
      setError("บันทึกไม่สำเร็จ: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/crm");
    router.refresh();
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <Link
        href="/dashboard/crm"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} />
        กลับ CRM
      </Link>

      <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-slate-800">
        <UserPlus size={24} className="text-teal-600" />
        เพิ่มลูกค้าใหม่
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Name */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              ชื่อลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>

          {/* Contact */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทร</label>
              <input
                name="phone"
                type="tel"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="0xx-xxx-xxxx"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">LINE ID</label>
              <input
                name="line_id"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="@line_id"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="email@example.com"
            />
          </div>

          {/* Budget */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">งบขั้นต่ำ (฿)</label>
              <input
                name="budget_min"
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="500,000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">งบสูงสุด (฿)</label>
              <input
                name="budget_max"
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="2,000,000"
              />
            </div>
          </div>

          {/* Status & Source */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">สถานะ</label>
              <select
                name="status"
                defaultValue="active"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              >
                <option value="hot">Hot - สนใจมาก</option>
                <option value="warm">Warm - สนใจปานกลาง</option>
                <option value="active">Active - ติดต่อได้</option>
                <option value="cold">Cold - ติดตามภายหลัง</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">แหล่งที่มา</label>
              <select
                name="source"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              >
                <option value="">เลือก...</option>
                <option value="website">เว็บไซต์</option>
                <option value="line">LINE</option>
                <option value="facebook">Facebook</option>
                <option value="referral">แนะนำ</option>
                <option value="walk-in">Walk-in</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-slate-700">โน้ต</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="ความต้องการ, รายละเอียดเพิ่มเติม..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            บันทึกลูกค้า
          </button>
        </div>
      </form>
    </div>
  );
}
