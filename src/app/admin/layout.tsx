import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  FileText,
  Users,
  Image,
  CreditCard,
  MessageCircle,
  DollarSign,
  ArrowLeft,
  ScrollText,
  Wallet,
  UserPlus,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "ประกาศ", href: "/admin/listings", icon: FileText },
  { label: "ผู้ใช้", href: "/admin/users", icon: Users },
  { label: "ตัวแทน", href: "/admin/agents", icon: UserPlus },
  { label: "การชำระเงิน", href: "/admin/payments", icon: CreditCard },
  { label: "เติมเครดิต", href: "/admin/topups", icon: Wallet },
  { label: "ราคาบริการ", href: "/admin/pricing", icon: DollarSign },
  { label: "แบนเนอร์", href: "/admin/banners", icon: Image },
  { label: "LINE Bot", href: "/admin/line", icon: MessageCircle },
];

const SUPER_ADMIN_NAV = [
  { label: "Activity Logs", href: "/admin/activity-logs", icon: ScrollText },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireAdmin();
  const isSuperAdmin = role === "super_admin";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
              <Home size={14} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-[#1e3a5f]">BanChang</span>
              <span className="text-sm font-extrabold text-teal-600">Hub</span>
              <p className="text-[10px] text-slate-400">
                {isSuperAdmin ? "Super Admin" : "Admin Panel"}
              </p>
            </div>
          </div>
          <nav className="p-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#1e3a5f]"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}

            {isSuperAdmin && (
              <>
                <div className="my-3 h-px bg-slate-100" />
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Super Admin
                </p>
                {SUPER_ADMIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-amber-700 transition-colors hover:bg-amber-50"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            <div className="my-3 h-px bg-slate-100" />
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft size={16} />
              กลับ Dashboard
            </Link>
          </nav>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white lg:hidden">
        {NAV.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-slate-500 hover:text-teal-600"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
        {isSuperAdmin && (
          <Link
            href="/admin/activity-logs"
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-amber-600 hover:text-amber-700"
          >
            <ScrollText size={18} />
            Logs
          </Link>
        )}
      </div>

      {/* Main */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
