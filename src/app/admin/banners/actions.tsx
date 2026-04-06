"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Eye, EyeOff, Trash2, Save } from "lucide-react";

export default function AdminBannerActions({
  mode,
  bannerId,
  isActive,
}: {
  mode: "create" | "edit";
  bannerId?: string;
  isActive?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta_text: "",
    link_url: "",
    position: "top",
    bg_gradient: "from-[#1e3a5f] to-[#0d9488]",
  });
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("banners").insert({
      title: form.title,
      subtitle: form.subtitle || null,
      cta_text: form.cta_text || null,
      link_url: form.link_url || null,
      position: form.position,
      bg_gradient: form.bg_gradient,
      is_active: true,
    });

    if (!error) {
      setShowForm(false);
      setForm({ title: "", subtitle: "", cta_text: "", link_url: "", position: "top", bg_gradient: "from-[#1e3a5f] to-[#0d9488]" });
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive() {
    if (!bannerId) return;
    setLoading(true);
    setShowMenu(false);
    const { error } = await supabase.from("banners").update({ is_active: !isActive }).eq("id", bannerId);
    if (error) alert("อัปเดตไม่สำเร็จ: " + error.message);
    else router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!bannerId) return;
    if (!window.confirm("ลบแบนเนอร์นี้?")) return;
    setLoading(true);
    setShowMenu(false);
    const { error } = await supabase.from("banners").delete().eq("id", bannerId);
    if (error) alert("ลบไม่สำเร็จ: " + error.message);
    else router.refresh();
    setLoading(false);
  }

  if (mode === "create") {
    return (
      <>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={16} /> สร้างแบนเนอร์
        </button>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <form
              onSubmit={handleCreate}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <h3 className="mb-4 text-lg font-bold text-slate-800">สร้างแบนเนอร์ใหม่</h3>
              <div className="space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="หัวข้อ *"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="คำอธิบาย"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.cta_text}
                    onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                    placeholder="ข้อความปุ่ม"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <input
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder="URL ลิงก์"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="top">ด้านบน</option>
                  <option value="hero">Hero</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="listing">ในประกาศ</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <Save size={14} /> {loading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        )}
      </>
    );
  }

  // Edit mode
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
          <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              onClick={toggleActive}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
              {isActive ? "ปิดแบนเนอร์" : "เปิดแบนเนอร์"}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 size={13} /> ลบ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
