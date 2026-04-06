import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Filter,
  MessageCircle,
} from "lucide-react";
import AppointmentActions from "./actions";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const activeTab = tab ?? "incoming";

  // นัดที่คนอื่นนัดเรา (เราเป็นเอเจนท์/เจ้าของ)
  const { data: incoming } = await supabase
    .from("appointments")
    .select(
      `*,
      requester:requester_id(full_name, phone, avatar_url),
      listing:listing_id(title, listing_code)`
    )
    .eq("agent_id", user.id)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  // นัดที่เรานัดคนอื่น
  const { data: outgoing } = await supabase
    .from("appointments")
    .select(
      `*,
      agent:agent_id(full_name, phone, avatar_url, company_name),
      listing:listing_id(title, listing_code)`
    )
    .eq("requester_id", user.id)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  const appointments = activeTab === "incoming" ? incoming : outgoing;

  const statusConfig: Record<
    string,
    { text: string; cls: string; icon: typeof CheckCircle2 }
  > = {
    pending: {
      text: "รอยืนยัน",
      cls: "bg-yellow-100 text-yellow-700",
      icon: AlertCircle,
    },
    confirmed: {
      text: "ยืนยันแล้ว",
      cls: "bg-green-100 text-green-700",
      icon: CheckCircle2,
    },
    cancelled: {
      text: "ยกเลิก",
      cls: "bg-red-100 text-red-600",
      icon: XCircle,
    },
    completed: {
      text: "เสร็จสิ้น",
      cls: "bg-blue-100 text-blue-600",
      icon: CheckCircle2,
    },
    no_show: {
      text: "ไม่มา",
      cls: "bg-slate-100 text-slate-600",
      icon: XCircle,
    },
  };

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(time: string) {
    return time.slice(0, 5) + " น.";
  }

  // แบ่งกลุ่มตามวัน
  const grouped: Record<string, typeof appointments> = {};
  for (const apt of appointments ?? []) {
    const key = apt.scheduled_date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(apt);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-700"
            >
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
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              ตารางนัดหมาย
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              ตารางนัดหมาย
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการนัดดูทรัพย์สินและพบเอเจนท์
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1">
          {[
            {
              key: "incoming",
              label: "นัดเข้ามา",
              count: incoming?.length ?? 0,
            },
            {
              key: "outgoing",
              label: "นัดของฉัน",
              count: outgoing?.length ?? 0,
            },
          ].map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/appointments?tab=${t.key}`}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === t.key
                      ? "bg-teal-100 text-teal-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Appointments List */}
        {!appointments || appointments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
              <Calendar size={24} className="text-slate-300" />
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">
              {activeTab === "incoming"
                ? "ยังไม่มีนัดเข้ามา"
                : "ยังไม่มีนัดหมาย"}
            </p>
            <p className="text-xs text-slate-400">
              {activeTab === "incoming"
                ? "เมื่อมีลูกค้านัดดูทรัพย์สิน จะแสดงที่นี่"
                : "นัดดูทรัพย์สินจากหน้าประกาศ"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => {
              const isToday = date === today;
              const isPast = date < today;

              return (
                <div key={date}>
                  {/* Date Header */}
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isToday
                          ? "bg-teal-100 text-teal-700"
                          : isPast
                            ? "bg-slate-100 text-slate-500"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {isToday ? "วันนี้" : ""} {formatDate(date)}
                    </div>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* Appointment Cards */}
                  <div className="space-y-3">
                    {items!.map((apt) => {
                      const st =
                        statusConfig[apt.status] ?? statusConfig.pending;
                      const StatusIcon = st.icon;
                      const person =
                        activeTab === "incoming"
                          ? (apt as { requester?: { full_name: string; phone: string; avatar_url: string } }).requester
                          : (apt as { agent?: { full_name: string; phone: string; avatar_url: string; company_name: string } }).agent;
                      const listing = apt.listing as {
                        title: string;
                        listing_code: string;
                      } | null;

                      return (
                        <div
                          key={apt.id}
                          className={`rounded-xl border bg-white shadow-sm transition-colors ${
                            apt.status === "confirmed"
                              ? "border-green-200"
                              : apt.status === "cancelled"
                                ? "border-slate-200 opacity-60"
                                : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
                            {/* Time */}
                            <div className="hidden shrink-0 flex-col items-center rounded-lg bg-slate-50 px-3 py-2 sm:flex">
                              <Clock
                                size={14}
                                className="mb-1 text-slate-400"
                              />
                              <span className="text-sm font-bold text-slate-800">
                                {formatTime(apt.scheduled_time)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {apt.duration_minutes} นาที
                              </span>
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}
                                >
                                  <StatusIcon size={11} />
                                  {st.text}
                                </span>
                                {listing?.listing_code && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                                    {listing.listing_code}
                                  </span>
                                )}
                              </div>

                              {listing && (
                                <Link
                                  href={`/listings/${apt.listing_id}`}
                                  className="mb-1.5 block truncate text-sm font-medium text-slate-800 hover:text-teal-600"
                                >
                                  {listing.title}
                                </Link>
                              )}

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User size={12} />
                                  {activeTab === "incoming"
                                    ? "ผู้นัด"
                                    : "เอเจนท์"}
                                  :{" "}
                                  <strong className="text-slate-700">
                                    {person?.full_name ?? "ไม่ทราบ"}
                                  </strong>
                                </span>
                                {apt.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {apt.location}
                                  </span>
                                )}
                              </div>

                              {apt.message && (
                                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <MessageCircle
                                    size={12}
                                    className="mt-0.5 shrink-0 text-slate-400"
                                  />
                                  <span>{apt.message}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="shrink-0">
                              <AppointmentActions
                                appointmentId={apt.id}
                                status={apt.status}
                                isAgent={activeTab === "incoming"}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
