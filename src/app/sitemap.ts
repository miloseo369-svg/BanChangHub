import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/listings`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Active listings
  const { data: listings } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${SITE_URL}/listings/${l.id}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Published articles
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1000);

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Category filter pages (pre-render popular filters for crawling)
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name");

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/listings?category=${c.id}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Province filter pages
  const { data: provinces } = await supabase
    .from("provinces")
    .select("id, name, slug");

  const provinceFilterPages: MetadataRoute.Sitemap = (provinces ?? []).map((p) => ({
    url: `${SITE_URL}/listings?province=${p.id}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  // Hyper-local province pages (SEO landing pages)
  const provinceLocalPages: MetadataRoute.Sitemap = (provinces ?? []).map((p) => ({
    url: `${SITE_URL}/listings/province/${p.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...listingPages,
    ...articlePages,
    ...categoryPages,
    ...provinceFilterPages,
    ...provinceLocalPages,
  ];
}
