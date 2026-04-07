"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Save, Check, DollarSign, FileText, Palette, List, Eye, EyeOff } from "lucide-react";

type Service = {
  id: number;
  slug: string;
  title: string;
  description: string;
  start_price: number;
  price_unit: string;
  features: string[];
  accent_color: string;
  sort_order: number;
  is_active: boolean;
};

export default function PricingEditor({
  initialServices,
}: {
  initialServices: Service[];
}) {
  const [services, setServices] = useState(initialServices);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function update(id: number, field: string, value: unknown) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave(service: Service) {
    setSaving(service.id);

    const { error } = await supabase
      .from("service_pricing")
      .update({
        title: service.title,
        description: service.description,
        start_price: service.start_price,
        price_unit: service.price_unit,
        features: service.features,
        is_active: service.is_active,
        sort_order: service.sort_order,
      })
      .eq("id", service.id);

    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
    } else {
      setSaved(service.id);
      setTimeout(() => setSaved(null), 2000);
      router.refresh();
    }
    setSaving(null);
  }

  const colorOptions = [
    { value: "from-teal-500 to-emerald-500", label: "เขียว" },
    { value: "from-sky-500 to-blue-500", label: "ฟ้า" },
    { value: "from-amber-500 to-orange-500", label: "ส้ม" },
    { value: "from-violet-500 to-purple-500", label: "ม่วง" },
    { value: "from-rose-500 to-pink-500", label: "ชมพู" },
    { value: "from-red-500 to-rose-500", label: "แดง" },
    { value: "from-indigo-500 to-blue-600", label: "คราม" },
  ];

  return (
    <div className="space-y-4">
      {services.map((s) => (
        <div
          key={s.id}
          className={`rounded-2xl border bg-white shadow-sm transition-all ${
            !s.is_active ? "border-slate-200 opacity-60" : "border-slate-200"
          }`}
        >
          {/* Color bar */}
          <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${s.accent_color}`} />

          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono text-slate-500">
                  {s.slug}
                </span>
                <span className="text-xs text-slate-400">#{s.sort_order}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(s.id, "is_active", !s.is_active)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                    s.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {s.is_active ? "แสดง" : "ซ่อน"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <FileText size={12} /> ชื่อบริการ
                </label>
                <input
                  value={s.title}
                  onChange={(e) => update(s.id, "title", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>

              {/* Price + Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <DollarSign size={12} /> ราคาเริ่มต้น
                  </label>
                  <input
                    type="number"
                    value={s.start_price}
                    onChange={(e) => update(s.id, "start_price", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-600">หน่วย</label>
                  <select
                    value={s.price_unit}
                    onChange={(e) => update(s.id, "price_unit", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  >
                    <option value="บาท/ตร.ม.">บาท/ตร.ม.</option>
                    <option value="บาท/หลัง">บาท/หลัง</option>
                    <option value="บาท/งาน">บาท/งาน</option>
                    <option value="บาท">บาท</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="mb-1 text-xs font-semibold text-slate-600">คำอธิบาย</label>
                <input
                  value={s.description}
                  onChange={(e) => update(s.id, "description", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>

              {/* Features */}
              <div className="sm:col-span-2">
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <List size={12} /> จุดเด่น (คั่นด้วย ,)
                </label>
                <input
                  value={(s.features ?? []).join(", ")}
                  onChange={(e) =>
                    update(
                      s.id,
                      "features",
                      e.target.value.split(",").map((f) => f.trim()).filter(Boolean)
                    )
                  }
                  placeholder="ออกแบบฟรี, ควบคุมโดยวิศวกร, รับประกัน 5 ปี"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Save */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(s)}
                disabled={saving === s.id}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  saved === s.id
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:shadow-md"
                } disabled:opacity-50`}
              >
                {saved === s.id ? (
                  <><Check size={13} /> บันทึกแล้ว</>
                ) : saving === s.id ? (
                  "กำลังบันทึก..."
                ) : (
                  <><Save size={13} /> บันทึก</>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
