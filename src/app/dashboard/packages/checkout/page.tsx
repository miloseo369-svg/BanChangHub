import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, ArrowLeft, Package, Clock, ShieldCheck } from "lucide-react";
import CheckoutClient from "./checkout-client";
import { getSiteSettings } from "@/lib/settings";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ package_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const packageId = Number(params.package_id);
  if (!packageId) redirect("/dashboard/packages");

  // Fetch package
  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (!pkg || pkg.price <= 0) redirect("/dashboard/packages");

  // Check if user already has pending payment for this package
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status, expires_at")
    .eq("user_id", user.id)
    .eq("package_id", packageId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  const features = pkg.features as Record<string, boolean> | null;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/packages" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
                <Home size={16} className="text-white" />
              </div>
              <span className="text-xl font-extrabold">
                <span className="text-[#1e3a5f]">BanChang</span>
                <span className="text-teal-600">Hub</span>
              </span>
            </Link>
          </div>
          <span className="text-sm text-slate-500">ชำระเงิน</span>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">ชำระเงิน</h1>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Package size={16} className="text-teal-600" />
                สรุปรายการ
              </h2>
              <div className="mb-4 rounded-lg bg-teal-50 p-4">
                <p className="text-lg font-bold text-teal-800">{pkg.name}</p>
                <p className="text-xs text-teal-600">{pkg.duration_days} วัน</p>
              </div>
              <ul className="mb-4 space-y-1.5 text-xs text-slate-600">
                <li>ลงประกาศ {pkg.max_listings === -1 ? "ไม่จำกัด" : `${pkg.max_listings} รายการ`}</li>
                <li>ดูข้อมูลผู้ประกาศทั้งหมด</li>
                {features?.boost && <li>บูสต์ประกาศได้</li>}
                {features?.certified && <li>ป้าย Certified</li>}
                {features?.priority_support && <li>ซัพพอร์ตด่วน</li>}
              </ul>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-slate-500">ราคา</span>
                  <span className="text-2xl font-extrabold text-slate-800">
                    ฿{Number(pkg.price).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-[11px] text-amber-700">
                <Clock size={14} className="shrink-0" />
                ชำระภายใน 30 นาที หลังสร้างรายการ
              </div>
            </div>
          </div>

          {/* Payment QR */}
          <div className="lg:col-span-3">
            <CheckoutClient
              packageId={pkg.id}
              packageName={pkg.name}
              amount={Number(pkg.price)}
              existingPaymentId={existingPayment?.id ?? null}
              promptpayId={(await getSiteSettings()).promptpay_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
