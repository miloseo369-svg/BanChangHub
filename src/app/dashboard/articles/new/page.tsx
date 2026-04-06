"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ArrowLeft, Save, Eye } from "lucide-react";

export default function NewArticlePage() {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "general",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from title
    if (field === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 100);
      setForm((prev) => ({ ...prev, slug }));
    }
  }

  async function handleSave(publish: boolean) {
    setError("");
    if (!form.title.trim()) {
      setError("กรุณากรอกหัวข้อ");
      return;
    }
    if (!form.slug.trim()) {
      setError("กรุณากรอก slug");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error: insertError } = await supabase
      .from("articles")
      .insert({
        author_id: user.id,
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content || null,
        category: form.category,
        tags: tags.length > 0 ? tags : null,
        status: publish ? "published" : "draft",
        published_at: publish ? new Date().toISOString() : null,
      })
      .select("slug")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (publish && data) {
      router.push(`/articles/${data.slug}`);
    } else {
      router.push("/dashboard");
    }
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Save size={14} className="mr-1 inline" />
              บันทึกร่าง
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Eye size={14} className="mr-1 inline" />
              เผยแพร่
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">หัวข้อ *</label>
            <input
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="หัวข้อบทความ"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="url-slug"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">หมวดหมู่</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
              >
                <option value="general">ทั่วไป</option>
                <option value="buy">ซื้อบ้าน</option>
                <option value="build">สร้างบ้าน</option>
                <option value="renovate">รีโนเวท</option>
                <option value="invest">ลงทุน</option>
                <option value="tips">เคล็ดลับ</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">แท็ก (คั่นด้วย ,)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="บ้าน, อุดรธานี, ลงทุน"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">บทคัดย่อ</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              placeholder="สรุปสั้นๆ แสดงใน card..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">เนื้อหา</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={15}
              placeholder="เนื้อหาบทความ..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
