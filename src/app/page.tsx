"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Home,
  Hammer,
  Store,
  Shield,
  Award,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  Building2,
  Users,
  Star,
  Menu,
  X,
  CheckCircle2,
  BadgeCheck,
  Eye,
  Heart,
  ChevronRight,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Share2,
  Bookmark,
  User,
  Clock,
  ShieldCheck,
  LogIn,
  Sparkles,
} from "lucide-react";

// ─── Data ───
const PROVINCES = ["อุดรธานี", "หนองคาย", "ขอนแก่น", "เลย", "หนองบัวลำภู", "สกลนคร", "นครพนม", "บึงกาฬ"];
const PROPERTY_TYPES = ["บ้านเดี่ยว", "ทาวน์โฮม", "คอนโด", "ที่ดินเปล่า", "อาคารพาณิชย์"];
const PRICE_RANGES = ["ต่ำกว่า 1 ล้าน", "1 - 3 ล้าน", "3 - 5 ล้าน", "5 - 10 ล้าน", "10 ล้านขึ้นไป"];

const PROPERTIES = [
  { id: "BCH-25680001", title: "บ้านเดี่ยว พรีเมียม อุดรธานี", price: "3,590,000", pricePerSqm: "23,933", location: "ต.หมากแข้ง อ.เมือง จ.อุดรธานี", beds: 3, baths: 2, parking: 2, area: "150", landArea: "60 ตร.วา", type: "บ้านเดี่ยว", tag: "ใหม่", views: 324, saves: 48, agent: "คุณสมชาย", agentCompany: "BanChangHub", daysAgo: 3, photos: 12 },
  { id: "BCH-25680002", title: "บ้านสวย ริมโขง หนองคาย", price: "4,290,000", pricePerSqm: "21,450", location: "ต.มีชัย อ.เมือง จ.หนองคาย", beds: 4, baths: 3, parking: 2, area: "200", landArea: "80 ตร.วา", type: "บ้านเดี่ยว", tag: "ขายดี", views: 512, saves: 87, agent: "คุณวิภา", agentCompany: "BanChangHub", daysAgo: 5, photos: 18 },
  { id: "BCH-25680003", title: "บ้านช่างโมเดิร์น ขอนแก่น", price: "5,890,000", pricePerSqm: "23,560", location: "ต.ในเมือง อ.เมือง จ.ขอนแก่น", beds: 4, baths: 3, parking: 3, area: "250", landArea: "100 ตร.วา", type: "บ้านเดี่ยว", tag: "แนะนำ", views: 698, saves: 124, agent: "คุณสมชาย", agentCompany: "BanChangHub", daysAgo: 1, photos: 24 },
  { id: "BCH-25680004", title: "หมู่บ้านจัดสรร บ้านดุง", price: "2,790,000", pricePerSqm: "21,461", location: "ต.ศรีสุทโธ อ.บ้านดุง จ.อุดรธานี", beds: 3, baths: 2, parking: 1, area: "130", landArea: "50 ตร.วา", type: "บ้านเดี่ยว", tag: "โปรพิเศษ", views: 256, saves: 35, agent: "คุณนภา", agentCompany: "BanChangHub", daysAgo: 7, photos: 10 },
];

// Fallback ถ้า DB ยังไม่พร้อม
const DEFAULT_SERVICES = [
  { title: "สร้างบ้านใหม่", desc: "ออกแบบและสร้างบ้านในฝัน ควบคุมทุกขั้นตอนโดยวิศวกร", startPrice: "8,500", unit: "บาท/ตร.ม.", features: ["ออกแบบฟรี", "ควบคุมโดยวิศวกร", "รับประกัน 5 ปี"], accent: "from-teal-500 to-emerald-500" },
  { title: "รีโนเวทบ้าน", desc: "ปรับปรุงบ้านเก่าให้เป็นบ้านใหม่ งานไฟ ประปา โครงสร้าง ครบวงจร", startPrice: "3,500", unit: "บาท/ตร.ม.", features: ["ประเมินราคาฟรี", "ไม่มีค่าใช้จ่ายซ่อน", "ดูแลหลังงาน"], accent: "from-sky-500 to-blue-500" },
  { title: "ต่อเติม-ปรับปรุง", desc: "ต่อเติมห้อง ครัว หลังคา ระเบียง เพิ่มพื้นที่ใช้สอย", startPrice: "5,000", unit: "บาท/ตร.ม.", features: ["ตรวจโครงสร้างฟรี", "ใบอนุญาตถูกต้อง", "วัสดุคุณภาพ"], accent: "from-amber-500 to-orange-500" },
  { title: "บ้านน็อคดาวน์", desc: "บ้านสำเร็จรูป สร้างไว ราคาประหยัด พร้อมอยู่ภายใน 45 วัน", startPrice: "4,500", unit: "บาท/ตร.ม.", features: ["สร้างเสร็จ 45 วัน", "ราคาเหมาจ่าย", "ย้ายได้ ทนทาน"], accent: "from-violet-500 to-purple-500" },
  { title: "บ้านน้องหมา-น้องแมว", desc: "ออกแบบและสร้างบ้านสัตว์เลี้ยง คอกสุนัข กรงแมว สั่งทำตามขนาด", startPrice: "2,500", unit: "บาท/หลัง", features: ["สั่งทำตามขนาด", "วัสดุปลอดภัย", "กันฝน-แดด"], accent: "from-rose-500 to-pink-500" },
];

const MARKETPLACE = [
  { title: "เซ้งร้านกาแฟ ทำเลทอง ริมถนนใหญ่", price: "290,000", location: "หนองคาย", type: "เซ้งกิจการ", hot: true },
  { title: "ขายที่ดิน 2 ไร่ ใกล้ถนนมิตรภาพ", price: "1,200,000", location: "อุดรธานี", type: "ที่ดิน", hot: false },
  { title: "เซ้งร้านอาหาร พร้อมอุปกรณ์ครบ", price: "180,000", location: "ขอนแก่น", type: "เซ้งกิจการ", hot: true },
  { title: "ขายอาคารพาณิชย์ 2 คูหา ติดถนน", price: "3,500,000", location: "สกลนคร", type: "อาคารพาณิชย์", hot: false },
];

const REVIEWS = [
  { name: "คุณสมศักดิ์", role: "เจ้าของบ้าน อุดรธานี", text: "สร้างบ้านกับ BanChangHub ประทับใจมาก ช่างตรงเวลา งานเนี้ยบ วิศวกรคุมงานทุกวัน ราคายุติธรรม", rating: 5, project: "สร้างบ้านใหม่" },
  { name: "คุณนภา", role: "นักลงทุน หนองคาย", text: "ซื้อบ้านในโครงการ Certified มาตรฐานดีจริง เอกสารครบ โอนไว ไม่ต้องกังวลเรื่องคุณภาพ", rating: 5, project: "ซื้อบ้านจัดสรร" },
  { name: "คุณวิชัย", role: "เจ้าของร้าน ขอนแก่น", text: "ลงประกาศเซ้งร้านได้ผู้ซื้อภายใน 2 สัปดาห์ ระบบใช้ง่าย ทีมงานช่วยดูแลตลอด", rating: 5, project: "เซ้งกิจการ" },
];

// ─── Helpers ───
function SelectField({ placeholder, options }: { placeholder: string; options: string[] }) {
  return (
    <div className="relative flex-1">
      <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ─── Main ───
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [currentBanner, setCurrentBanner] = useState(0);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [dbArticles, setDbArticles] = useState<{ title: string; slug: string; category: string; cover_image: string | null; published_at: string }[]>([]);

  // Load service pricing from DB
  useEffect(() => {
    async function loadPricing() {
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        const { data } = await supabase
          .from("service_pricing")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        if (data && data.length > 0) {
          setServices(
            data.map((s) => ({
              title: s.title,
              desc: s.description ?? "",
              startPrice: Number(s.start_price).toLocaleString(),
              unit: s.price_unit,
              features: (s.features as string[]) ?? [],
              accent: s.accent_color ?? "from-teal-500 to-emerald-500",
            }))
          );
        }
      } catch {
        // DB ยังไม่พร้อม — ใช้ default
      }
    }
    loadPricing();

    // Load articles
    async function loadArticles() {
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        const { data } = await supabase
          .from("articles")
          .select("title, slug, category, cover_image, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(6);
        if (data && data.length > 0) setDbArticles(data);
      } catch {}
    }
    loadArticles();
  }, []);

  const BANNERS = [
    { title: "โปรโมชั่นพิเศษ! ฟรีค่าโอน", subtitle: "ซื้อบ้านจัดสรรในโครงการที่ร่วมรายการ วันนี้ - 30 เม.ย. 2569", cta: "ดูโครงการ", bg: "from-[#1e3a5f] to-[#0d9488]" },
    { title: "รับสร้างบ้าน เริ่มต้น ฿8,500/ตร.ม.", subtitle: "ออกแบบฟรี ควบคุมงานโดยวิศวกร รับประกันโครงสร้าง 5 ปี", cta: "ปรึกษาฟรี", bg: "from-[#0d9488] to-[#065f46]" },
    { title: "ลงประกาศเซ้งกิจการ ฟรี!", subtitle: "เข้าถึงผู้ซื้อกว่า 2,500 ราย ทั่วอีสานตอนบน", cta: "ลงประกาศเลย", bg: "from-[#7c3aed] to-[#4f46e5]" },
  ];

  // Auto slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const FAQ_DATA = [
    { question: "BanChangHub คืออะไร?", answer: "BanChangHub หรือ บ้านช่างฮับ คือแพลตฟอร์มอสังหาริมทรัพย์และรับเหมาก่อสร้างครบวงจร สำหรับอีสานตอนบน ครอบคลุม อุดรธานี หนองคาย ขอนแก่น เลย สกลนคร นครพนม หนองบัวลำภู และบึงกาฬ" },
    { question: "ลงประกาศขายบ้านฟรีได้ไหม?", answer: "ได้ครับ สมัครสมาชิกฟรี ลงประกาศได้ 1 รายการ หากต้องการลงเพิ่มสามารถอัปเกรดแพ็กเกจ Pro หรือ Business" },
    { question: "BanChangHub รับเหมาสร้างบ้านด้วยไหม?", answer: "ใช่ครับ เรามีบริการรับเหมาสร้างบ้านใหม่ รีโนเวท ต่อเติม ควบคุมงานโดยวิศวกร เริ่มต้น 3,500 บาท/ตร.ม. รับประกันโครงสร้าง 5 ปี" },
    { question: "เซ้งร้านผ่าน BanChangHub ปลอดภัยไหม?", answer: "เราตรวจสอบประกาศทุกรายการก่อนเผยแพร่ แนะนำให้ตรวจสอบทรัพย์สินด้วยตัวเองก่อนโอน และใช้สัญญาซื้อขายที่ถูกต้องตามกฎหมาย" },
    { question: "ค่าบริการแพ็กเกจ Pro เท่าไร?", answer: "แพ็กเกจ Pro ราคา 299 บาท/เดือน ลงประกาศได้ 10 รายการ บูสต์ประกาศได้ ดูข้อมูลผู้ประกาศทั้งหมด พร้อมซัพพอร์ตด่วน" },
  ];

  const LOCAL_PROVINCES = [
    { name: "อุดรธานี", desc: "บ้านจัดสรร คอนโด ที่ดิน รับเหมาก่อสร้าง อุดรธานี" },
    { name: "หนองคาย", desc: "บ้านริมโขง เซ้งร้าน ที่ดิน หนองคาย" },
    { name: "ขอนแก่น", desc: "บ้านจัดสรร คอนโด อาคารพาณิชย์ ขอนแก่น" },
    { name: "เลย", desc: "บ้านวิวภูเขา ที่ดิน รีสอร์ท เลย" },
    { name: "สกลนคร", desc: "บ้านจัดสรร ที่ดิน สกลนคร" },
    { name: "นครพนม", desc: "บ้าน ที่ดิน ริมโขง นครพนม" },
    { name: "หนองบัวลำภู", desc: "บ้าน ที่ดิน หนองบัวลำภู" },
    { name: "บึงกาฬ", desc: "บ้าน ที่ดิน บึงกาฬ" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800">

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_DATA.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }),
        }}
      />
      {/* LocalBusiness per province */}
      {LOCAL_PROVINCES.map((p) => (
        <script
          key={p.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: `BanChangHub ${p.name}`,
              description: p.desc,
              url: `https://banchanghub.com/listings`,
              areaServed: { "@type": "AdministrativeArea", name: p.name },
              address: { "@type": "PostalAddress", addressRegion: p.name, addressCountry: "TH" },
              parentOrganization: { "@type": "Organization", name: "BanChangHub", url: "https://banchanghub.com" },
            }),
          }}
        />
      ))}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-xl font-extrabold">
              <span className="text-[#1e3a5f]">BanChang</span>
              <span className="text-teal-600">Hub</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {[
              { label: "โครงการบ้าน", href: "/#properties" },
              { label: "รับสร้างบ้าน", href: "/#services" },
              { label: "เซ้งกิจการ", href: "/#marketplace" },
              { label: "บทความ", href: "/#articles" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e3a5f]">{l.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex">
              <LogIn size={15} />
              เข้าสู่ระบบ
            </Link>
            <Link href="/listings/new" className="hidden rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 sm:inline-flex">
              ลงประกาศฟรี
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500 md:hidden">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t bg-white px-4 py-3 md:hidden">
            {[
              { label: "โครงการบ้าน", href: "/#properties" },
              { label: "รับสร้างบ้าน", href: "/#services" },
              { label: "เซ้งกิจการ", href: "/#marketplace" },
              { label: "บทความ", href: "/#articles" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">{l.label}</a>
            ))}
            <Link href="/login" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <LogIn size={15} />
              เข้าสู่ระบบ
            </Link>
            <Link href="/listings/new" className="mt-2 block rounded-lg bg-teal-600 py-2 text-center text-sm font-semibold text-white">ลงประกาศฟรี</Link>
          </div>
        )}
      </nav>

      {/* BANNER — compact, inside hero */}

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2439] via-[#1e3a5f] to-[#0d3d5f] px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-10 h-40 w-40 rounded-full bg-amber-400/5 blur-2xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            {/* Promo banner — integrated */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/30 px-4 py-1.5 text-xs font-semibold text-amber-200">
              <Sparkles size={13} /> {BANNERS[currentBanner].title}
              <span className="text-amber-300/60">|</span>
              <span className="text-[10px] text-amber-300/80">{BANNERS[currentBanner].subtitle.slice(0, 40)}</span>
            </div>
            <h1 className="mb-5 text-3xl font-extrabold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
              ค้นหาบ้านในฝัน
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">สร้างบ้านคุณภาพ</span>
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300/90 sm:text-base">
              บ้านจัดสรร รับเหมาก่อสร้าง เซ้งกิจการ — ครบจบในที่เดียว
              <br className="hidden sm:block" />
              บริหารโดยช่างตัวจริง มาตรฐานวิศวกร
            </p>
          </div>

          {/* Search Tabs */}
          <div className="mx-auto max-w-4xl">
            {/* Tabs */}
            <div className="flex justify-center gap-2 mb-4">
              {[
                { key: "home", label: "ซื้อบ้าน", icon: Home },
                { key: "build", label: "สร้าง/รีโนเวท", icon: Hammer },
                { key: "seng", label: "เซ้งกิจการ", icon: Store },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.key ? "bg-white text-[#1e3a5f] shadow-lg shadow-white/20" : "bg-white/10 text-white/80 hover:bg-white/20"}`}>
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/20 ring-1 ring-white/20 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-1">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MapPin size={13} className="text-teal-500" /> จังหวัด
                  </label>
                  <SelectField placeholder="ทุกจังหวัด" options={PROVINCES} />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Home size={13} className="text-sky-500" /> ประเภท
                  </label>
                  <SelectField
                    placeholder={activeTab === "build" ? "ประเภทงาน" : activeTab === "seng" ? "ประเภทกิจการ" : "ประเภทบ้าน"}
                    options={activeTab === "build" ? ["สร้างบ้านใหม่", "รีโนเวท", "ต่อเติม"] : activeTab === "seng" ? ["ร้านอาหาร", "ร้านกาแฟ", "ร้านค้า"] : PROPERTY_TYPES}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Ruler size={13} className="text-amber-500" /> งบประมาณ
                  </label>
                  <SelectField placeholder="ทุกราคา" options={PRICE_RANGES} />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <Link href="/listings" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-xl hover:shadow-teal-500/40">
                    <Search size={18} /> ค้นหา
                  </Link>
                </div>
              </div>

              {/* Popular tags — inside search box */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="font-semibold">ยอดนิยม:</span>
                {["บ้านอุดรธานี", "บ้านหนองคาย", "ที่ดินขอนแก่น", "รับเหมาอุดร", "เซ้งร้านหนองคาย"].map((kw) => (
                  <Link key={kw} href={`/listings?q=${encodeURIComponent(kw)}`}
                    className="rounded-full bg-slate-50 px-3 py-1 text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700">{kw}</Link>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Building2, val: "150+", label: "โครงการบ้าน", gradient: "from-teal-400 to-emerald-400" },
              { icon: Users, val: "2,500+", label: "ลูกค้าเชื่อมั่น", gradient: "from-sky-400 to-blue-400" },
              { icon: Star, val: "4.9/5", label: "คะแนนรีวิว", gradient: "from-amber-400 to-orange-400" },
              { icon: Shield, val: "100%", label: "รับประกันงาน", gradient: "from-emerald-400 to-green-400" },
            ].map((s) => (
              <div key={s.label} className="group rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-center backdrop-blur-sm transition-all hover:bg-white/10">
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-lg`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: โครงการบ้าน */}
      <section id="properties" className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
              <Award size={12} /> โครงการบ้าน
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl lg:text-3xl">โครงการบ้านใหม่ คุณภาพ BanChang Certified</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">คัดสรรจากเจ้าของโครงการโดยตรง ตรวจสอบมาตรฐานก่อนขึ้นประกาศทุกหลัง</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {PROPERTIES.map((p) => (
              <div key={p.title} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-slate-300 sm:flex">
                {/* รูปภาพ */}
                <div className="relative h-52 w-full shrink-0 bg-gradient-to-br from-teal-50 via-sky-50 to-blue-50 sm:h-auto sm:w-64">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home size={40} className="text-teal-200" />
                  </div>
                  {/* Certified Badge */}
                  <div className="absolute right-0 top-3 flex items-center gap-1 rounded-l-full bg-amber-600 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                    <BadgeCheck size={12} /> Certified
                  </div>
                  {/* Tag */}
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-teal-600 px-2 py-0.5 text-[10px] font-semibold text-white">{p.tag}</span>
                  {/* จำนวนรูป */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    <Eye size={10} /> {p.photos} รูป
                  </div>
                  {/* ประเภท */}
                  <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-600">{p.type}</span>
                </div>

                {/* รายละเอียด */}
                <div className="flex flex-1 flex-col p-4">
                  {/* ชื่อ + ที่อยู่ */}
                  <h3 className="mb-0.5 text-base font-bold text-slate-800 group-hover:text-[#1e3a5f]">{p.title}</h3>
                  <p className="mb-3 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} />{p.location}
                  </p>

                  {/* ราคา */}
                  <div className="mb-3">
                    <p className="text-xl font-extrabold text-teal-700">฿{p.price} <span className="text-xs font-normal text-slate-400">บาท</span></p>
                    <p className="text-[11px] text-slate-400">฿{p.pricePerSqm} / ตร.ม.</p>
                  </div>

                  {/* Spec Icons แบบ DDproperty */}
                  <div className="mb-3 flex items-center gap-4 rounded-lg bg-gradient-to-r from-teal-50/60 to-sky-50/60 px-3 py-2.5">
                    <div className="flex flex-col items-center gap-0.5">
                      <BedDouble size={16} className="text-teal-600" />
                      <span className="text-xs font-semibold text-slate-700">{p.beds}</span>
                      <span className="text-[9px] text-slate-400">ห้องนอน</span>
                    </div>
                    <div className="h-8 w-px bg-teal-200/50" />
                    <div className="flex flex-col items-center gap-0.5">
                      <Bath size={16} className="text-sky-600" />
                      <span className="text-xs font-semibold text-slate-700">{p.baths}</span>
                      <span className="text-[9px] text-slate-400">ห้องน้ำ</span>
                    </div>
                    <div className="h-8 w-px bg-teal-200/50" />
                    <div className="flex flex-col items-center gap-0.5">
                      <Car size={16} className="text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700">{p.parking}</span>
                      <span className="text-[9px] text-slate-400">จอดรถ</span>
                    </div>
                    <div className="h-8 w-px bg-teal-200/50" />
                    <div className="flex flex-col items-center gap-0.5">
                      <Ruler size={16} className="text-amber-600" />
                      <span className="text-xs font-semibold text-slate-700">{p.area}</span>
                      <span className="text-[9px] text-slate-400">ตร.ม.</span>
                    </div>
                  </div>

                  {/* ที่ดิน */}
                  <p className="mb-3 text-[11px] text-slate-400">เนื้อที่ {p.landArea}</p>

                  {/* ผู้ลงประกาศ + ปุ่ม */}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f]/10">
                        <User size={14} className="text-[#1e3a5f]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">{p.agent}</p>
                        <p className="text-[9px] text-slate-400">{p.agentCompany}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:text-red-400" title="บันทึก">
                        <Heart size={14} />
                      </button>
                      <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-blue-200 hover:text-blue-400" title="แชร์">
                        <Share2 size={14} />
                      </button>
                      <button className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#152d4a]">
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>

                  {/* เวลาลงประกาศ + รหัสทรัพย์ */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-1"><Clock size={10} /> ประกาศ {p.daysAgo} วันที่แล้ว</span>
                    <span>รหัสทรัพย์: {p.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/listings?type=property" className="group inline-flex items-center gap-1.5 rounded-lg border border-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
              ดูโครงการทั้งหมด <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: รับเหมา */}
      <section id="services" className="bg-section-cool px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-700">
              <Hammer size={12} /> บริการรับเหมา
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl lg:text-3xl">รับเหมาก่อสร้าง & รีโนเวท มาตรฐานวิศวกร</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">ทีมช่างมืออาชีพ ควบคุมงานโดยวิศวกร รับประกันคุณภาพทุกโครงการ</p>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {services.map((s) => (
              <div key={s.title} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
                <div className={`h-1.5 bg-gradient-to-r ${s.accent}`} />
                <div className="p-5">
                  <h3 className="mb-1.5 text-lg font-bold text-slate-800">{s.title}</h3>
                  <p className="mb-3 text-xs text-slate-500">{s.desc}</p>
                  <div className="mb-4 rounded-lg bg-teal-50 px-3 py-2.5">
                    <p className="text-[10px] text-slate-500">เริ่มต้นเพียง</p>
                    <p className="text-lg font-extrabold text-teal-700">฿{s.startPrice} <span className="text-xs font-normal text-slate-400">{s.unit}</span></p>
                  </div>
                  <ul className="mb-4 space-y-1.5">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[11px] text-slate-600"><CheckCircle2 size={13} className="text-teal-500" />{f}</li>
                    ))}
                  </ul>
                  <button className="w-full rounded-lg border border-teal-600 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-600 hover:text-white">สอบถามราคา</button>
                </div>
              </div>
            ))}
          </div>

          {/* Process Steps */}
          <h3 className="mb-6 text-center text-lg font-bold text-slate-800">ขั้นตอนการทำงาน</h3>
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 1, title: "ติดต่อปรึกษาฟรี", desc: "โทรหรือ LINE สอบถาม ทีมงานพร้อมให้คำปรึกษาทุกวัน", color: "from-teal-500 to-teal-600" },
              { step: 2, title: "สำรวจ & ประเมินราคา", desc: "ช่างเข้าสำรวจหน้างาน ประเมินราคาชัดเจน ไม่มีค่าใช้จ่ายซ่อน", color: "from-sky-500 to-blue-600" },
              { step: 3, title: "เซ็นสัญญา & เริ่มงาน", desc: "ตกลงราคา ทำสัญญาชัดเจน เริ่มงานตามแผน", color: "from-amber-500 to-orange-500" },
              { step: 4, title: "ส่งมอบ & รับประกัน", desc: "ตรวจงานก่อนรับมอบ พร้อมรับประกันคุณภาพโครงสร้าง", color: "from-emerald-500 to-green-600" },
            ].map((ps, i) => (
              <div key={ps.step} className="relative flex flex-col items-center rounded-xl bg-white p-5 text-center shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${ps.color} text-sm font-extrabold text-white shadow-sm`}>{ps.step}</div>
                <h4 className="mb-1 text-sm font-bold text-slate-800">{ps.title}</h4>
                <p className="text-[11px] text-slate-500">{ps.desc}</p>
                {i < 3 && <ChevronRight size={18} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block" />}
              </div>
            ))}
          </div>

          {/* AI Banner */}
          <div className="overflow-hidden rounded-xl bg-gradient-to-r from-[#1e3a5f] to-[#152d4a] p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Search size={28} className="text-teal-300" />
                </div>
              <div className="flex-1">
                <span className="mb-1 inline-block rounded-full bg-teal-400/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-300">ประเมินราคาออนไลน์</span>
                <h3 className="mb-1 text-lg font-extrabold text-white">ประเมินราคารีโนเวทออนไลน์</h3>
                <p className="text-xs text-slate-300">ระบุขนาดพื้นที่และงานที่ต้องการ ระบบคำนวณราคาเบื้องต้นให้ทันที</p>
              </div>
              <button className="shrink-0 rounded-lg bg-teal-500 px-6 py-3 text-sm font-bold text-white hover:bg-teal-600">ประเมินราคาฟรี</button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: ตลาดเซ้ง */}
      <section id="marketplace" className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-700">
              <Store size={12} /> ตลาดเซ้ง
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl lg:text-3xl">ตลาดเซ้งกิจการ & ประกาศทั่วไป</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">แหล่งรวมประกาศซื้อ-ขาย เซ้งกิจการ ที่ดิน และอสังหาฯ ทั่วอีสานตอนบน</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE.map((m) => (
              <div key={m.title} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
                <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
                  <Store size={24} className="text-orange-200" />
                  {m.hot && <span className="absolute right-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">HOT</span>}
                </div>
                <div className="p-3.5">
                  <span className="mb-1.5 inline-block rounded bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">{m.type}</span>
                  <h3 className="mb-1 text-[13px] font-semibold text-slate-700">{m.title}</h3>
                  <p className="mb-1.5 flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={10} />{m.location}</p>
                  <p className="text-base font-extrabold text-[#1e3a5f]">฿{m.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/listings?type=marketplace" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a5f] hover:text-teal-600">
              ดูประกาศทั้งหมด <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: ทำไมเลือกเรา */}
      <section className="bg-section-warm px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl lg:text-3xl">ทำไมต้อง BanChangHub</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">ไม่ได้แค่ขายบ้าน แต่ดูแลครบวงจร</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: ShieldCheck, title: "ตรวจสอบคุณภาพทุกหลัง", desc: "ทุกโครงการผ่านการตรวจสอบมาตรฐาน", color: "text-teal-600 bg-teal-50" },
              { Icon: Building2, title: "ครบวงจรในที่เดียว", desc: "บ้านจัดสรร, รับสร้างบ้าน, เซ้งกิจการ", color: "text-[#1e3a5f] bg-blue-50" },
              { Icon: Search, title: "ประเมินราคาออนไลน์", desc: "ช่วยวางแผนงบก่อนเริ่มงานจริง", color: "text-amber-600 bg-amber-50" },
              { Icon: Phone, title: "ทีมงานดูแลตลอด", desc: "ปรึกษาฟรี ไม่ทิ้งกลางทาง", color: "text-emerald-600 bg-emerald-50" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-5 text-center shadow-sm hover:shadow-md">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <item.Icon size={24} />
                </div>
                <h3 className="mb-1 text-sm font-bold text-slate-800">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: รีวิว */}
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl lg:text-3xl">เสียงจากลูกค้าจริง</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">รีวิวจากลูกค้าที่ใช้บริการ BanChangHub</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className="rounded-xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-5 shadow-sm">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-slate-600">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.role}</p>
                  </div>
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">{r.project}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: บทความ */}
      <section id="articles" className="bg-section-soft px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl">บทความ & ความรู้</h2>
              <p className="mt-1 text-xs text-slate-500">เรื่องน่ารู้เกี่ยวกับบ้าน การก่อสร้าง และการลงทุนอสังหาฯ</p>
            </div>
            <Link href="/articles" className="group hidden items-center gap-1 text-sm font-semibold text-[#1e3a5f] hover:text-teal-600 sm:inline-flex">
              ดูทั้งหมด ({dbArticles.length > 0 ? `${dbArticles.length}+` : ""}) <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(dbArticles.length > 0 ? dbArticles.slice(0, 3) : [
              { title: "5 สิ่งที่ต้องเช็คก่อนซื้อบ้านจัดสรร", slug: "", category: "buy", cover_image: null, published_at: "" },
              { title: "รีโนเวทบ้านเก่า งบ 5 แสน ทำอะไรได้บ้าง?", slug: "", category: "renovate", cover_image: null, published_at: "" },
              { title: "เปรียบเทียบ สร้างบ้านเอง vs ซื้อบ้านจัดสรร", slug: "", category: "build", cover_image: null, published_at: "" },
            ]).map((article) => (
              <Link key={article.title} href={article.slug ? `/articles/${article.slug}` : "/articles"} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
                  {article.cover_image ? (
                    <img src={article.cover_image} alt={article.title} className="h-full w-full object-cover" />
                  ) : (
                    <Award size={32} className="text-purple-200" />
                  )}
                </div>
                <div className="p-4">
                  <span className="mb-2 inline-block rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">{article.category}</span>
                  <h3 className="mb-2 text-sm font-bold leading-snug text-slate-800 group-hover:text-[#1e3a5f]">{article.title}</h3>
                  {article.published_at && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{new Date(article.published_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link href="/articles" className="group inline-flex items-center gap-1 text-sm font-semibold text-[#1e3a5f]">
              ดูบทความทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section — ช่วย SEO Featured Snippets */}
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl">คำถามที่พบบ่อย</h2>
            <p className="mt-1 text-xs text-slate-500">เกี่ยวกับ BanChangHub และบริการของเรา</p>
          </div>
          <div className="space-y-3">
            {FAQ_DATA.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800 marker:content-none">
                  {faq.question}
                  <ChevronDown size={16} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1e3a5f] via-[#1a4971] to-teal-800 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">สนใจสร้างบ้าน หรือหาบ้านใหม่?</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-slate-300">ปรึกษาทีมงานได้ฟรี ไม่มีค่าใช้จ่าย ทุกวัน 8:00 - 20:00 น.</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="tel:0812345678" className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-8 py-3 text-sm font-bold text-white hover:bg-teal-600"><Phone size={16} /> โทรหาเรา</a>
            <a href="https://line.me/R/ti/p/@banchanghub" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#06c755] px-8 py-3 text-sm font-bold text-white hover:brightness-110"><MessageCircle size={16} /> LINE @banchanghub</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="mb-3 inline-block text-lg font-extrabold"><span className="text-[#1e3a5f]">BanChang</span><span className="text-teal-600">Hub</span></span>
              <p className="mb-4 text-[11px] text-slate-500">แพลตฟอร์มอสังหาริมทรัพย์และรับเหมาก่อสร้างครบวงจร สำหรับอีสานตอนบน</p>
              <div className="flex gap-2">
                <a href="https://line.me/R/ti/p/@banchanghub" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:text-[#06c755]"><MessageCircle size={16} /></a>
                <a href="tel:0812345678" className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:text-[#1e3a5f]"><Phone size={16} /></a>
                <a href="mailto:info@banchanghub.com" className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:text-red-400"><Mail size={16} /></a>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">บริการ</h4>
              <ul className="space-y-2 text-[11px] text-slate-500">
                {["บ้านจัดสรร อุดรธานี", "บ้านจัดสรร หนองคาย", "รับเหมาก่อสร้าง อีสานบน", "รีโนเวทบ้าน อุดรธานี"].map((l) => (
                  <li key={l}><a href="/#properties" className="hover:text-[#1e3a5f]">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">ตลาดเซ้ง</h4>
              <ul className="space-y-2 text-[11px] text-slate-500">
                {["เซ้งร้านหนองคาย", "เซ้งร้านอุดรธานี", "ขายที่ดิน อีสานตอนบน", "อาคารพาณิชย์ขอนแก่น"].map((l) => (
                  <li key={l}><a href="/#marketplace" className="hover:text-[#1e3a5f]">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">ติดต่อเรา</h4>
              <ul className="space-y-2 text-[11px] text-slate-500">
                <li className="flex items-center gap-2"><Phone size={11} /> 08X-XXX-XXXX</li>
                <li className="flex items-center gap-2"><Mail size={11} /> info@banchanghub.com</li>
                <li className="flex items-center gap-2"><MapPin size={11} /> อ.เมือง จ.อุดรธานี</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-[10px] text-slate-400">&copy; 2026 BanChangHub.com - บ้านช่างฮับ สงวนลิขสิทธิ์</p>
            <p className="mt-1 text-[9px] text-slate-300">บ้านอุดรธานี | เซ้งร้านหนองคาย | รับเหมาอีสานบน | สร้างบ้านขอนแก่น | ที่ดินอีสาน</p>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2">
          <Link href="/listings" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-2.5 text-xs font-bold text-white shadow-sm">
            <Search size={14} /> ค้นหา
          </Link>
          <Link href="/listings/new" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1e3a5f] py-2.5 text-xs font-bold text-white shadow-sm">
            <Home size={14} /> ลงประกาศ
          </Link>
          <a href="tel:0812345678" className="flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-white shadow-sm">
            <Phone size={16} />
          </a>
          <a href="https://line.me/R/ti/p/@banchanghub" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl bg-[#06c755] px-4 py-2.5 text-white shadow-sm">
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
      {/* Spacer for mobile sticky */}
      <div className="h-16 sm:hidden" />

      {/* LINE Floating — desktop only */}
      <a href="https://line.me/R/ti/p/@banchanghub" target="_blank" rel="noopener noreferrer" className="fixed bottom-5 right-5 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#06c755] shadow-lg transition-transform hover:scale-110 sm:flex" title="LINE">
        <MessageCircle size={26} className="text-white" />
      </a>
    </div>
  );
}
