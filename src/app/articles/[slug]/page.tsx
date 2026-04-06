import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Home, ArrowLeft, Clock, User, Eye, Tag } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title, excerpt, cover_image")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "ไม่พบบทความ" };

  return {
    title: data.title,
    description: data.excerpt?.slice(0, 160) || data.title,
    openGraph: {
      title: data.title,
      description: data.excerpt?.slice(0, 160) || "",
      images: data.cover_image ? [{ url: data.cover_image }] : undefined,
      type: "article",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.com"}/articles/${slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*, profiles:author_id(full_name, avatar_url)")
    .eq("slug", slug)
    .single();

  if (!article) notFound();

  // Increment view
  void supabase.from("articles").update({ view_count: (article.view_count ?? 0) + 1 }).eq("id", article.id);

  const author = article.profiles as unknown as { full_name: string; avatar_url: string } | null;
  const tags = (article.tags as string[]) ?? [];

  const { articleJsonLd, breadcrumbJsonLd } = await import("@/lib/jsonld");

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            cover_image: article.cover_image,
            author_name: author?.full_name ?? null,
            published_at: article.published_at,
            updated_at: article.updated_at,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: "หน้าแรก", url: "/" },
            { name: "บทความ", url: "/articles" },
            { name: article.title, url: `/articles/${article.slug}` },
          ])),
        }}
      />

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/articles" className="text-slate-500 hover:text-slate-700"><ArrowLeft size={18} /></Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]"><Home size={16} className="text-white" /></div>
              <span className="text-xl font-extrabold"><span className="text-[#1e3a5f]">BanChang</span><span className="text-teal-600">Hub</span></span>
            </Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        {/* Cover */}
        {article.cover_image && (
          <div className="mb-6 overflow-hidden rounded-xl">
            <img src={article.cover_image} alt={article.title} className="w-full object-cover" />
          </div>
        )}

        {/* Category */}
        {article.category && (
          <span className="mb-3 inline-block rounded bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            {article.category}
          </span>
        )}

        <h1 className="mb-4 text-2xl font-extrabold text-slate-800 sm:text-3xl">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {author && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                {author.full_name?.charAt(0) ?? "?"}
              </div>
              <span className="font-medium text-slate-700">{author.full_name}</span>
            </div>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {new Date(article.published_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye size={14} /> {article.view_count ?? 0} views
          </span>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-slate-700">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {article.content}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Tag size={14} className="text-slate-400" />
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {t}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
