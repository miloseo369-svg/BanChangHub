import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Home, Clock, ArrowLeft, User } from "lucide-react";

export const metadata: Metadata = {
  title: "บทความ & ความรู้",
  description: "บทความเกี่ยวกับบ้าน การก่อสร้าง การลงทุนอสังหาริมทรัพย์ อีสานตอนบน",
};

export default async function ArticlesPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("*, profiles:author_id(full_name)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-700"><ArrowLeft size={18} /></Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]"><Home size={16} className="text-white" /></div>
              <span className="text-xl font-extrabold"><span className="text-[#1e3a5f]">BanChang</span><span className="text-teal-600">Hub</span></span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">บทความ & ความรู้</h1>

        {!articles || articles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <p className="text-sm text-slate-500">ยังไม่มีบทความ</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => {
              const author = a.profiles as unknown as { full_name: string } | null;
              return (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
                    {a.cover_image ? (
                      <img src={a.cover_image} alt={a.title} className="h-full w-full object-cover" />
                    ) : (
                      <Home size={32} className="text-purple-200" />
                    )}
                  </div>
                  <div className="p-4">
                    {a.category && (
                      <span className="mb-2 inline-block rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        {a.category}
                      </span>
                    )}
                    <h2 className="mb-2 text-sm font-bold leading-snug text-slate-800 group-hover:text-[#1e3a5f]">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="mb-3 line-clamp-2 text-xs text-slate-500">{a.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      {author?.full_name && (
                        <span className="flex items-center gap-1"><User size={10} /> {author.full_name}</span>
                      )}
                      {a.published_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(a.published_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
