import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Check,
  Crown,
  Star,
  Zap,
  ShieldCheck,
  Headphones,
  Package,
} from "lucide-react";

export default async function PackagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch packages
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  // Fetch user's current subscription
  const { data: currentSub } = await supabase
    .from("subscriptions")
    .select("*, packages:package_id(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const planStyles: Record<string, { border: string; badge: string; icon: typeof Star; iconColor: string }> = {
    "ฟรี": {
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-600",
      icon: Package,
      iconColor: "text-slate-400",
    },
    Pro: {
      border: "border-teal-300 ring-1 ring-teal-100",
      badge: "bg-teal-100 text-teal-700",
      icon: Zap,
      iconColor: "text-teal-500",
    },
    Business: {
      border: "border-amber-300 ring-1 ring-amber-100",
      badge: "bg-amber-100 text-amber-700",
      icon: Crown,
      iconColor: "text-amber-500",
    },
  };

  const currentPackageName = currentSub
    ? (currentSub.packages as { name: string } | null)?.name
    : "ฟรี";

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
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
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-800">แพ็กเกจสมาชิก</h1>
          <p className="mt-2 text-sm text-slate-500">
            เลือกแพ็กเกจที่เหมาะกับคุณ เพื่อเข้าถึงฟีเจอร์เต็มรูปแบบ
          </p>
          {currentPackageName && (
            <p className="mt-2 text-xs text-teal-600">
              แพ็กเกจปัจจุบัน: <strong>{currentPackageName}</strong>
              {currentSub && (
                <span className="text-slate-400">
                  {" "}(หมดอายุ{" "}
                  {new Date(currentSub.expires_at).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  )
                </span>
              )}
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(packages ?? []).map((pkg) => {
            const style = planStyles[pkg.name] ?? planStyles["ฟรี"];
            const PlanIcon = style.icon;
            const features = pkg.features as Record<string, boolean> | null;
            const isCurrent = pkg.name === currentPackageName;

            const maxCoAgents = pkg.max_co_agents ?? 0;
            const featureList = [
              {
                text: pkg.max_listings === -1 ? "ลงประกาศไม่จำกัด" : `ลงประกาศได้ ${pkg.max_listings} รายการ`,
                included: true,
              },
              { text: "เห็นข้อมูลผู้ประกาศทั้งหมด", included: pkg.price > 0 },
              { text: "บูสต์ประกาศ", included: features?.boost ?? false },
              { text: `Co-Agent ${maxCoAgents} คน`, included: maxCoAgents > 0 },
              { text: "ป้าย Certified", included: features?.certified ?? false },
              { text: "ซัพพอร์ตด่วน", included: features?.priority_support ?? false },
              { text: `ระยะเวลา ${pkg.duration_days} วัน`, included: true },
            ];

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm ${style.border} ${
                  isCurrent ? "ring-2 ring-teal-400" : ""
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-[10px] font-bold text-white">
                    แพ็กเกจปัจจุบัน
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 ${style.iconColor}`}>
                    <PlanIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{pkg.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                      {pkg.duration_days} วัน
                    </span>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800">
                      ฿{Number(pkg.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-400">/เดือน</span>
                  </div>
                </div>

                <ul className="mb-6 space-y-2.5">
                  {featureList.map((f) => (
                    <li key={f.text} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check size={15} className="shrink-0 text-teal-500" />
                      ) : (
                        <div className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] text-slate-400">
                          —
                        </div>
                      )}
                      <span className={f.included ? "text-slate-700" : "text-slate-400"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-400"
                  >
                    ใช้งานอยู่
                  </button>
                ) : pkg.price === 0 ? (
                  <button
                    disabled
                    className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500"
                  >
                    ฟรี
                  </button>
                ) : (
                  <Link
                    href={`/dashboard/packages/checkout?package_id=${pkg.id}`}
                    className="block w-full rounded-lg bg-teal-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    เลือกแพ็กเกจนี้
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <ShieldCheck size={20} className="mx-auto mb-2 text-teal-500" />
          <p className="mb-1 text-sm font-bold text-slate-800">ปลอดภัย 100%</p>
          <p className="text-xs text-slate-500">
            ยกเลิกได้ตลอดเวลา ไม่มีค่าธรรมเนียมแฝง คืนเงินภายใน 7 วันหากไม่พอใจ
          </p>
        </div>
      </div>
    </div>
  );
}
