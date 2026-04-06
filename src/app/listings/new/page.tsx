"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Upload,
  MapPin,
  DollarSign,
  FileText,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Layers,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Tag,
  Sparkles,
  Compass,
  Sofa,
  CalendarDays,
  Dumbbell,
  ShieldCheck,
  Waves,
  TreePine,
  School,
  ShoppingBag,
  Stethoscope,
  Train,
  Church,
} from "lucide-react";

type Category = { id: number; name: string; slug: string; type: string };
type Province = { id: number; name: string; slug: string };

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "property" as "property" | "marketplace",
    listing_type: "sell",
    category_id: "",
    province_id: "",
    price: "",
    address: "",
    district: "",
    sub_district: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    floor_area: "",
    land_area: "",
    floors: "",
    furnishing: "" as "" | "none" | "partial" | "full",
    facing: "",
    amenities: [] as string[],
    nearby: [] as string[],
    year_built: "",
  });

  useEffect(() => {
    async function loadData() {
      const [catRes, provRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("provinces").select("*").order("name"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (provRes.data) setProvinces(provRes.data);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArray(field: "amenities" | "nearby", value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || (form.type === "marketplace" && c.type === "marketplace")
  );

  async function handleSubmit() {
    setError("");
    if (!form.title.trim()) {
      setError("กรุณากรอกหัวข้อประกาศ");
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

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description || null,
        type: form.type,
        listing_type: form.listing_type,
        category_id: form.category_id ? Number(form.category_id) : null,
        province_id: form.province_id ? Number(form.province_id) : null,
        price: form.price ? Number(form.price) : null,
        address: form.address || null,
        district: form.district || null,
        sub_district: form.sub_district || null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        parking: form.parking ? Number(form.parking) : null,
        floor_area: form.floor_area ? Number(form.floor_area) : null,
        land_area: form.land_area || null,
        floors: form.floors ? Number(form.floors) : null,
        furnishing: form.furnishing || null,
        facing: form.facing || null,
        amenities: form.amenities.length > 0 ? form.amenities : null,
        nearby: form.nearby.length > 0 ? form.nearby : null,
        year_built: form.year_built ? Number(form.year_built) : null,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/listings/${data.id}`);
  }

  const steps = [
    { num: 1, label: "ประเภท", icon: Tag },
    { num: 2, label: "รายละเอียด", icon: FileText },
    { num: 3, label: "ที่ตั้ง", icon: MapPin },
    { num: 4, label: "สเปค & ราคา", icon: Sparkles },
  ];

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#faf9f6] to-teal-50/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e3a5f] to-teal-700">
                <Home size={14} className="text-white" />
              </div>
              <span className="text-lg font-extrabold">
                <span className="text-[#1e3a5f]">BanChang</span>
                <span className="text-teal-600">Hub</span>
              </span>
            </Link>
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">ลงประกาศใหม่</span>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => setStep(s.num)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      step === s.num
                        ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-200"
                        : step > s.num
                          ? "bg-teal-100 text-teal-700"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step > s.num ? <Check size={16} /> : <s.icon size={16} />}
                  </div>
                  <span className={`text-[11px] font-medium ${step === s.num ? "text-teal-700" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`mx-2 mb-5 h-0.5 w-8 rounded-full sm:w-16 ${step > s.num ? "bg-teal-300" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        {/* ─── Step 1: ประเภท ─── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Type Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-slate-800">ประเภทประกาศ</h2>
              <p className="mb-5 text-xs text-slate-400">เลือกประเภทที่ตรงกับทรัพย์สินของคุณ</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "property", label: "อสังหาริมทรัพย์", desc: "บ้าน, คอนโด, ที่ดิน", icon: Home, color: "from-blue-500 to-indigo-600" },
                  { value: "marketplace", label: "เซ้ง / ตลาด", desc: "ร้านค้า, กิจการ", icon: Building2, color: "from-amber-500 to-orange-600" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => updateForm("type", t.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all ${
                      form.type === t.value
                        ? "border-teal-500 bg-teal-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-sm`}>
                      <t.icon size={22} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{t.label}</span>
                    <span className="text-[11px] text-slate-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Type + Category */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-800">รูปแบบ & หมวดหมู่</h3>

              <div className="mb-5">
                <label className={labelClass}>รูปแบบการขาย</label>
                <div className="flex gap-2">
                  {[
                    { value: "sell", label: "ขาย", color: "from-teal-500 to-emerald-600" },
                    { value: "rent", label: "เช่า", color: "from-sky-500 to-blue-600" },
                    { value: "transfer", label: "เซ้ง", color: "from-amber-500 to-orange-500" },
                  ].map((lt) => (
                    <button
                      key={lt.value}
                      onClick={() => updateForm("listing_type", lt.value)}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                        form.listing_type === lt.value
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>หมวดหมู่</label>
                <select
                  value={form.category_id}
                  onChange={(e) => updateForm("category_id", e.target.value)}
                  className={inputClass}
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Next */}
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-teal-200 transition-all hover:shadow-lg hover:shadow-teal-300"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: รายละเอียด + สเปค ─── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Title & Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-slate-800">รายละเอียดประกาศ</h2>
              <p className="mb-5 text-xs text-slate-400">หัวข้อที่ดีช่วยให้ประกาศถูกค้นพบได้ง่ายขึ้น</p>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    หัวข้อประกาศ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    placeholder="เช่น บ้านเดี่ยว 3 ห้องนอน หมู่บ้านสุขสวัสดิ์ อุดรธานี"
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {form.title.length}/200 ตัวอักษร
                  </p>
                </div>

                <div>
                  <label className={labelClass}>รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    rows={4}
                    placeholder={"บรรยายจุดเด่นของทรัพย์สิน เช่น\n• ใกล้ห้างฯ ตลาด โรงเรียน\n• ตกแต่งพร้อมอยู่\n• เฟอร์นิเจอร์ครบ"}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Compact Specs */}
            {form.type === "property" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-800">สเปคทรัพย์สิน</h3>

                {/* Bed / Bath / Parking — inline compact pickers */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  {/* ห้องนอน */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <BedDouble size={13} className="text-teal-500" /> นอน
                    </label>
                    <div className="flex gap-1">
                      {["1","2","3","4","5"].map((v) => (
                        <button key={v} onClick={() => updateForm("bedrooms", v)}
                          className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition-all ${form.bedrooms === v ? "border border-teal-400 bg-teal-50 text-teal-700" : "border border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                        >{v}{v === "5" ? "+" : ""}</button>
                      ))}
                    </div>
                  </div>
                  {/* ห้องน้ำ */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Bath size={13} className="text-sky-500" /> น้ำ
                    </label>
                    <div className="flex gap-1">
                      {["1","2","3","4","5"].map((v) => (
                        <button key={v} onClick={() => updateForm("bathrooms", v)}
                          className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition-all ${form.bathrooms === v ? "border border-sky-400 bg-sky-50 text-sky-700" : "border border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                        >{v}{v === "5" ? "+" : ""}</button>
                      ))}
                    </div>
                  </div>
                  {/* ที่จอดรถ */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Car size={13} className="text-indigo-500" /> จอดรถ
                    </label>
                    <div className="flex gap-1">
                      {["0","1","2","3","4"].map((v) => (
                        <button key={v} onClick={() => updateForm("parking", v)}
                          className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition-all ${form.parking === v ? "border border-indigo-400 bg-indigo-50 text-indigo-700" : "border border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                        >{v}{v === "4" ? "+" : ""}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Area / Land / Floors — compact inputs */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "floor_area", label: "พื้นที่ ตร.ม.", icon: Ruler, color: "text-amber-500", ph: "150" },
                    { key: "land_area", label: "เนื้อที่ดิน", icon: Layers, color: "text-emerald-500", ph: "60 ตร.วา" },
                    { key: "floors", label: "ชั้น", icon: Building2, color: "text-purple-500", ph: "2" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <f.icon size={13} className={f.color} />
                        {f.label}
                      </label>
                      <input
                        type={f.key === "land_area" ? "text" : "number"}
                        value={form[f.key as keyof typeof form]}
                        onChange={(e) => updateForm(f.key, e.target.value)}
                        placeholder={f.ph}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Furnishing + Facing + Year */}
            {form.type === "property" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-800">รายละเอียดเพิ่มเติม</h3>

                <div className="mb-4">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Sofa size={13} className="text-rose-500" /> เฟอร์นิเจอร์
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "none", label: "ไม่มี" },
                      { value: "partial", label: "บางส่วน" },
                      { value: "full", label: "ครบพร้อมอยู่" },
                    ].map((f) => (
                      <button key={f.value} onClick={() => updateForm("furnishing", f.value)}
                        className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${form.furnishing === f.value ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                      >{f.label}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Compass size={13} className="text-blue-500" /> ทิศหน้าบ้าน
                    </label>
                    <select value={form.facing} onChange={(e) => updateForm("facing", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-teal-500">
                      <option value="">ไม่ระบุ</option>
                      <option value="north">เหนือ</option>
                      <option value="south">ใต้</option>
                      <option value="east">ตะวันออก</option>
                      <option value="west">ตะวันตก</option>
                      <option value="northeast">ตะวันออกเฉียงเหนือ</option>
                      <option value="northwest">ตะวันตกเฉียงเหนือ</option>
                      <option value="southeast">ตะวันออกเฉียงใต้</option>
                      <option value="southwest">ตะวันตกเฉียงใต้</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <CalendarDays size={13} className="text-orange-500" /> ปีที่สร้าง
                    </label>
                    <input type="number" value={form.year_built} onChange={(e) => updateForm("year_built", e.target.value)}
                      placeholder="2567" className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-teal-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            {form.type === "property" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-slate-800">สิ่งอำนวยความสะดวก</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {[
                    { value: "pool", label: "สระว่ายน้ำ", icon: Waves, color: "text-sky-500" },
                    { value: "gym", label: "ฟิตเนส", icon: Dumbbell, color: "text-orange-500" },
                    { value: "security", label: "รปภ. 24 ชม.", icon: ShieldCheck, color: "text-green-500" },
                    { value: "cctv", label: "กล้องวงจรปิด", icon: ShieldCheck, color: "text-slate-500" },
                    { value: "garden", label: "สวน", icon: TreePine, color: "text-emerald-500" },
                    { value: "parking_covered", label: "ที่จอดรถมีหลังคา", icon: Car, color: "text-indigo-500" },
                    { value: "ac", label: "แอร์", icon: Sparkles, color: "text-blue-500" },
                    { value: "water_heater", label: "เครื่องทำน้ำอุ่น", icon: Waves, color: "text-red-400" },
                  ].map((a) => (
                    <button key={a.value} onClick={() => toggleArray("amenities", a.value)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition-all ${
                        form.amenities.includes(a.value) ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}>
                      <a.icon size={13} className={form.amenities.includes(a.value) ? "text-teal-500" : a.color} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-800">สถานที่ใกล้เคียง</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[
                  { value: "market", label: "ตลาด", icon: ShoppingBag, color: "text-orange-500" },
                  { value: "school", label: "โรงเรียน", icon: School, color: "text-blue-500" },
                  { value: "hospital", label: "โรงพยาบาล", icon: Stethoscope, color: "text-red-500" },
                  { value: "mall", label: "ห้างสรรพสินค้า", icon: ShoppingBag, color: "text-purple-500" },
                  { value: "temple", label: "วัด", icon: Church, color: "text-amber-500" },
                  { value: "transit", label: "ขนส่ง/สถานี", icon: Train, color: "text-teal-500" },
                  { value: "park", label: "สวนสาธารณะ", icon: TreePine, color: "text-green-500" },
                  { value: "restaurant", label: "ร้านอาหาร", icon: ShoppingBag, color: "text-rose-500" },
                ].map((n) => (
                  <button key={n.value} onClick={() => toggleArray("nearby", n.value)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition-all ${
                      form.nearby.includes(n.value) ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}>
                    <n.icon size={13} className={form.nearby.includes(n.value) ? "text-amber-500" : n.color} />
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nav */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-teal-200"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: ที่ตั้ง ─── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-slate-800">ที่ตั้งทรัพย์สิน</h2>
              <p className="mb-5 text-xs text-slate-400">ระบุตำแหน่งเพื่อให้ผู้สนใจค้นหาได้ง่าย</p>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>จังหวัด</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={form.province_id}
                      onChange={(e) => updateForm("province_id", e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">เลือกจังหวัด</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>อำเภอ / เขต</label>
                    <input
                      type="text"
                      value={form.district}
                      onChange={(e) => updateForm("district", e.target.value)}
                      placeholder="เมืองอุดรธานี"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ตำบล / แขวง</label>
                    <input
                      type="text"
                      value={form.sub_district}
                      onChange={(e) => updateForm("sub_district", e.target.value)}
                      placeholder="หมากแข้ง"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>ที่อยู่เพิ่มเติม</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="บ้านเลขที่ ถนน ซอย หมู่บ้าน"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-teal-200"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: ราคา + ยืนยัน ─── */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Price Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-slate-800">ตั้งราคา</h2>
              <p className="mb-5 text-xs text-slate-400">ระบุราคาเพื่อให้ผู้สนใจตัดสินใจได้เร็วขึ้น</p>

              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-teal-600">฿</div>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-4 pl-10 pr-4 text-xl font-bold text-slate-800 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              {form.price && (
                <p className="mt-2 text-sm font-semibold text-teal-600">
                  ฿{Number(form.price).toLocaleString()} บาท
                </p>
              )}
            </div>

            {/* Summary Preview */}
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 to-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-800">สรุปประกาศของคุณ</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">ประเภท</span>
                  <span className="font-medium text-slate-800">{form.type === "property" ? "อสังหาริมทรัพย์" : "เซ้ง/ตลาด"} — {form.listing_type === "sell" ? "ขาย" : form.listing_type === "rent" ? "เช่า" : "เซ้ง"}</span>
                </div>
                {form.title && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">หัวข้อ</span>
                    <span className="max-w-[200px] truncate font-medium text-slate-800">{form.title}</span>
                  </div>
                )}
                {form.type === "property" && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">สเปค</span>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      {form.bedrooms && <span className="flex items-center gap-1"><BedDouble size={13} className="text-teal-600" /> {form.bedrooms} นอน</span>}
                      {form.bathrooms && <span className="flex items-center gap-1"><Bath size={13} className="text-sky-600" /> {form.bathrooms} น้ำ</span>}
                      {form.parking && <span className="flex items-center gap-1"><Car size={13} className="text-indigo-600" /> {form.parking} จอดรถ</span>}
                      {form.floor_area && <span className="flex items-center gap-1"><Ruler size={13} className="text-amber-600" /> {form.floor_area} ตร.ม.</span>}
                    </div>
                  </div>
                )}
                {form.province_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">จังหวัด</span>
                    <span className="font-medium text-slate-800">{provinces.find((p) => String(p.id) === form.province_id)?.name ?? "-"}</span>
                  </div>
                )}
                {form.price && (
                  <div className="flex justify-between border-t border-teal-100 pt-2">
                    <span className="text-slate-500">ราคา</span>
                    <span className="text-lg font-extrabold text-teal-600">฿{Number(form.price).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:shadow-xl hover:shadow-teal-300 disabled:opacity-50"
              >
                {loading ? "กำลังบันทึก..." : "บันทึกประกาศ"}
                {!loading && <Upload size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
