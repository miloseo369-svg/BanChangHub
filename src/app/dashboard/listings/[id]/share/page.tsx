"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import {
  Home,
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  Share2,
  Sparkles,
  Globe,
} from "lucide-react";

type SiteContact = { contact_phone: string; line_id: string };

type Listing = {
  id: string;
  title: string;
  price: number;
  listing_type: string;
  listing_code: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  floor_area: number;
  land_area: string;
  district: string;
  description: string;
  categories: { name: string } | null;
  provinces: { name: string } | null;
  listing_images: { url: string; is_cover: boolean }[];
};

function getTemplates(contact: SiteContact) {
  return [
    {
      id: "standard",
      name: "มาตรฐาน",
      generate: (l: Listing, url: string) =>
        `🏠 ${l.listing_type === "sell" ? "ขาย" : l.listing_type === "rent" ? "ให้เช่า" : "เซ้ง"}${l.categories?.name ? ` ${l.categories.name}` : ""}\n\n` +
        `📌 ${l.title}\n` +
        `📍 ${[l.district, l.provinces?.name].filter(Boolean).join(", ")}\n\n` +
        `💰 ราคา ${l.price ? `฿${Number(l.price).toLocaleString()}` : "สอบถาม"}\n\n` +
        (l.bedrooms || l.bathrooms || l.floor_area
          ? `🛏 ${l.bedrooms || "-"} ห้องนอน | 🚿 ${l.bathrooms || "-"} ห้องน้ำ${l.floor_area ? ` | 📐 ${l.floor_area} ตร.ม.` : ""}${l.land_area ? ` | 🏞 ${l.land_area}` : ""}\n\n`
          : "") +
        (l.description ? `${l.description.slice(0, 200)}${l.description.length > 200 ? "..." : ""}\n\n` : "") +
        `🔗 ดูรายละเอียด: ${url}\n` +
        (contact.contact_phone ? `📞 สนใจติดต่อ: ${contact.contact_phone}\n` : "") +
        `\n#BanChangHub #${l.provinces?.name?.replace(/\s/g, "") ?? "อีสาน"} #${l.listing_type === "sell" ? "ขายบ้าน" : l.listing_type === "rent" ? "เช่าบ้าน" : "เซ้งกิจการ"}`,
    },
    {
      id: "short",
      name: "สั้นกระชับ",
      generate: (l: Listing, url: string) =>
        `${l.listing_type === "sell" ? "🔥 ขาย" : l.listing_type === "rent" ? "🏡 ให้เช่า" : "💼 เซ้ง"} ${l.title}\n` +
        `💰 ${l.price ? `฿${Number(l.price).toLocaleString()}` : "สอบถาม"}\n` +
        `📍 ${l.provinces?.name ?? ""}\n` +
        `👉 ${url}`,
    },
    {
      id: "detail",
      name: "ละเอียด",
      generate: (l: Listing, url: string) =>
        `═══════════════════\n` +
        `🏠 ${l.listing_type === "sell" ? "ประกาศขาย" : l.listing_type === "rent" ? "ประกาศให้เช่า" : "ประกาศเซ้ง"}\n` +
        `═══════════════════\n\n` +
        `📌 ${l.title}\n` +
        `🔖 รหัสทรัพย์: ${l.listing_code ?? "-"}\n` +
        `📍 ${[l.district, l.provinces?.name].filter(Boolean).join(", ")}\n\n` +
        `💰 ราคา: ${l.price ? `฿${Number(l.price).toLocaleString()} บาท` : "สอบถามราคา"}\n\n` +
        `📋 รายละเอียด:\n` +
        (l.bedrooms ? `  🛏 ห้องนอน: ${l.bedrooms}\n` : "") +
        (l.bathrooms ? `  🚿 ห้องน้ำ: ${l.bathrooms}\n` : "") +
        (l.parking ? `  🚗 ที่จอดรถ: ${l.parking}\n` : "") +
        (l.floor_area ? `  📐 พื้นที่: ${l.floor_area} ตร.ม.\n` : "") +
        (l.land_area ? `  🏞 เนื้อที่: ${l.land_area}\n` : "") +
        `\n` +
        (l.description ? `📝 ${l.description.slice(0, 300)}${l.description.length > 300 ? "..." : ""}\n\n` : "") +
        `🔗 ดูรายละเอียดเพิ่มเติม:\n${url}\n\n` +
        `📞 ติดต่อสอบถาม:\n` +
        (contact.contact_phone ? `โทร: ${contact.contact_phone}\n` : "") +
        (contact.line_id ? `LINE: ${contact.line_id}\n` : "") +
        `\n═══════════════════\n` +
        `BanChangHub - บ้านช่างฮับ\n` +
        `#${l.categories?.name?.replace(/\s/g, "") ?? "อสังหา"} #${l.provinces?.name?.replace(/\s/g, "") ?? "อีสาน"} #BanChangHub`,
    },
  ];
}

export default function ShareTemplatePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const supabase = createClient();
  const [listing, setListing] = useState<Listing | null>(null);
  const [contact, setContact] = useState<SiteContact>({ contact_phone: "", line_id: "" });
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      const [listingRes, settingsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*, categories:category_id(name), provinces:province_id(name), listing_images(url, is_cover)")
          .eq("id", params.id)
          .single(),
        supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["contact_phone", "line_id"]),
      ]);
      if (listingRes.data) setListing(listingRes.data as unknown as Listing);
      if (settingsRes.data) {
        const c: SiteContact = { contact_phone: "", line_id: "" };
        for (const row of settingsRes.data) {
          if (row.key === "contact_phone") c.contact_phone = row.value;
          if (row.key === "line_id") c.line_id = row.value;
        }
        setContact(c);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">กำลังโหลด...</div>;
  if (!listing) return <div className="flex min-h-screen items-center justify-center text-sm text-red-500">ไม่พบประกาศ</div>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app";
  const listingUrl = `${appUrl}/listings/${listing.id}`;
  const templates = getTemplates(contact);
  const template = templates.find((t) => t.id === selectedTemplate) ?? templates[0];
  const generatedText = template.generate(listing, listingUrl);

  function handleCopy() {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cover = listing.listing_images?.find((i) => i.is_cover) ?? listing.listing_images?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#faf9f6] to-teal-50/30">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/listings`} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-sm font-bold text-slate-800">สร้าง Template โพส</span>
          </div>
          <Sparkles size={18} className="text-teal-500" />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Preview Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
            {cover && (
              <img src={cover.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{listing.title}</p>
              <p className="text-xs text-teal-600">{listing.price ? `฿${Number(listing.price).toLocaleString()}` : "สอบถาม"}</p>
            </div>
          </div>
        </div>

        {/* Template Selector */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-slate-800">เลือก Template</label>
          <div className="flex gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all ${
                  selectedTemplate === t.id
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Text */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <textarea
            ref={textRef}
            value={generatedText}
            readOnly
            rows={12}
            className="w-full resize-none rounded-xl border-0 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all ${
              copied
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความ"}
          </button>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1877F2] py-3 text-xs font-semibold text-white shadow-md hover:shadow-lg"
          >
            <Globe size={14} />
            Facebook
          </a>

          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(listingUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#06c755] py-3 text-xs font-semibold text-white shadow-md hover:shadow-lg"
          >
            <MessageCircle size={14} />
            LINE
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(templates[1].generate(listing, listingUrl))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-white shadow-md hover:shadow-lg"
          >
            <Share2 size={14} />
            X / Twitter
          </a>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          คัดลอกข้อความแล้วไปวางใน Facebook, LINE กลุ่ม, IG หรือ Social อื่นๆ
        </p>
      </div>
    </div>
  );
}
