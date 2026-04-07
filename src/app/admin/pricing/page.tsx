import { requireAdmin } from "@/lib/admin";
import { DollarSign } from "lucide-react";
import PricingEditor from "./editor";

export default async function AdminPricingPage() {
  const { supabase } = await requireAdmin();

  const { data: services } = await supabase
    .from("service_pricing")
    .select("*")
    .order("sort_order");

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">ราคาบริการ</h1>
        <p className="mt-1 text-sm text-slate-500">แก้ไขราคาต่อตารางเมตร แสดงบนหน้าแรก</p>
      </div>

      {!services || services.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <DollarSign size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ยังไม่มีข้อมูลราคา — run migration 011 ก่อน</p>
        </div>
      ) : (
        <PricingEditor initialServices={services} />
      )}
    </div>
  );
}
