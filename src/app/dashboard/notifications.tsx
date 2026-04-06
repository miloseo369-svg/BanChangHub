"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  MessageCircle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Info,
  X,
} from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const typeIcon: Record<string, typeof Bell> = {
  appointment: Calendar,
  inquiry: MessageCircle,
  listing_approved: CheckCircle2,
  listing_rejected: XCircle,
  payment_confirmed: CreditCard,
  system: Info,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unread);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function handleClick(n: Notification) {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "เมื่อกี้";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชม.ที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-800">การแจ้งเตือน</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-teal-600 hover:text-teal-700"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">กำลังโหลด...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-xs text-slate-400">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcon[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        !n.is_read ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          !n.is_read ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs ${!n.is_read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="mt-0.5 truncate text-[11px] text-slate-400">{n.message}</p>
                        )}
                        <p className="mt-1 text-[10px] text-slate-300">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
