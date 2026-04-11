"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import {
  Save,
  Check,
  Phone,
  CreditCard,
  MessageCircle,
  Globe,
  Mail,
  Share2,
} from "lucide-react";

type Setting = {
  key: string;
  value: string;
  label: string;
  updated_at: string;
};

const ICONS: Record<string, typeof Phone> = {
  contact_phone: Phone,
  promptpay_id: CreditCard,
  line_id: MessageCircle,
  line_url: Globe,
  facebook_url: Share2,
  email: Mail,
};

const PLACEHOLDERS: Record<string, string> = {
  contact_phone: "0812345678",
  promptpay_id: "0812345678 หรือ เลขบัตรประชาชน",
  line_id: "@banchanghub",
  line_url: "https://line.me/ti/p/@banchanghub",
  facebook_url: "https://facebook.com/banchanghub",
  email: "contact@banchanghub.com",
};

export default function SettingsEditor({
  initialSettings,
}: {
  initialSettings: Setting[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function updateValue(key: string, value: string) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  }

  async function handleSaveAll() {
    setSaving(true);

    const promises = settings.map((s) =>
      supabase
        .from("site_settings")
        .update({ value: s.value, updated_at: new Date().toISOString() })
        .eq("key", s.key)
    );

    const results = await Promise.all(promises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } else {
      // Log activity
      await supabase.rpc("log_activity", {
        p_action: "settings.updated",
        p_entity_type: "site_settings",
        p_entity_id: "all",
        p_metadata: {
          keys: settings.map((s) => s.key),
        },
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
    setSaving(false);
  }

  // แบ่งเป็นกลุ่ม
  const contactKeys = ["contact_phone", "promptpay_id", "email"];
  const socialKeys = ["line_id", "line_url", "facebook_url"];

  const contactSettings = settings.filter((s) => contactKeys.includes(s.key));
  const socialSettings = settings.filter((s) => socialKeys.includes(s.key));

  function renderGroup(title: string, items: Setting[]) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-bold text-slate-700">{title}</h2>
        </div>
        <div className="divide-y divide-slate-50 px-5">
          {items.map((s) => {
            const Icon = ICONS[s.key] ?? Globe;
            return (
              <div key={s.key} className="py-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Icon size={13} className="text-slate-400" />
                  {s.label}
                </label>
                <input
                  value={s.value}
                  onChange={(e) => updateValue(s.key, e.target.value)}
                  placeholder={PLACEHOLDERS[s.key] ?? ""}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
                {s.updated_at && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    อัปเดตล่าสุด: {new Date(s.updated_at).toLocaleString("th-TH")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderGroup("ข้อมูลติดต่อ & การชำระเงิน", contactSettings)}
      {renderGroup("Social Media & LINE", socialSettings)}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className={`flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
            saved
              ? "bg-green-500 text-white"
              : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:shadow-md"
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <Check size={15} /> บันทึกแล้ว
            </>
          ) : saving ? (
            "กำลังบันทึก..."
          ) : (
            <>
              <Save size={15} /> บันทึกทั้งหมด
            </>
          )}
        </button>
      </div>
    </div>
  );
}
