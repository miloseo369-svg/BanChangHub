import { requireAdmin } from "@/lib/admin";
import { Image, Plus, Eye, MousePointer } from "lucide-react";
import AdminBannerActions from "./actions";

export default async function AdminBannersPage() {
  const { supabase } = await requireAdmin();

  const { data: banners } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order");

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800">จัดการแบนเนอร์</h1>
        <AdminBannerActions mode="create" />
      </div>

      {!banners || banners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <Image size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="mb-1 text-sm font-medium text-slate-600">ยังไม่มีแบนเนอร์</p>
          <p className="text-xs text-slate-400">สร้างแบนเนอร์เพื่อโปรโมทบนหน้าแรก</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                b.is_active ? "border-green-200" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Preview */}
                <div
                  className={`flex h-24 w-full items-center justify-center sm:w-48 ${
                    b.bg_gradient
                      ? `bg-gradient-to-r ${b.bg_gradient}`
                      : "bg-gradient-to-r from-[#1e3a5f] to-teal-600"
                  }`}
                >
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-white">
                      <p className="text-sm font-bold">{b.title}</p>
                      {b.subtitle && <p className="text-[10px] opacity-80">{b.subtitle}</p>}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-800">{b.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        b.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {b.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>ตำแหน่ง: {b.position}</span>
                      <span className="flex items-center gap-1"><Eye size={10} /> {b.view_count ?? 0}</span>
                      <span className="flex items-center gap-1"><MousePointer size={10} /> {b.click_count ?? 0}</span>
                      {b.cta_text && <span>CTA: {b.cta_text}</span>}
                    </div>
                  </div>
                  <AdminBannerActions mode="edit" bannerId={b.id} isActive={b.is_active} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
