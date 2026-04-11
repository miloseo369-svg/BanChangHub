import { requireAdmin } from "@/lib/admin";
import { Settings } from "lucide-react";
import SettingsEditor from "./editor";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .order("key");

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">ตั้งค่าเว็บไซต์</h1>
        <p className="mt-1 text-sm text-slate-500">
          แก้ไขข้อมูลติดต่อ, PromptPay และ Social Media ได้ตลอดเวลา
        </p>
      </div>

      {!settings || settings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <Settings size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ยังไม่มีข้อมูล — run migration 020 ก่อน</p>
        </div>
      ) : (
        <SettingsEditor initialSettings={settings} />
      )}
    </div>
  );
}
