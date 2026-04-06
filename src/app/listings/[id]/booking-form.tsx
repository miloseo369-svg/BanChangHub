"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function BookingForm({
  listingId,
  agentId,
}: {
  listingId: string;
  agentId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("กรุณาเลือกวันที่");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/login");
      return;
    }

    if (user.id === agentId) {
      setError("ไม่สามารถนัดหมายกับตัวเองได้");
      setLoading(false);
      return;
    }

    // เช็คนัดซ้ำ: requester เดิม + listing เดิม + วัน/เวลาเดิม + ยังไม่ถูกยกเลิก
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("listing_id", listingId)
      .eq("requester_id", user.id)
      .eq("scheduled_date", date)
      .eq("scheduled_time", time)
      .in("status", ["pending", "confirmed"])
      .limit(1);

    if (existing && existing.length > 0) {
      setError("คุณมีนัดหมายในวัน/เวลานี้แล้ว กรุณาเลือกเวลาอื่น");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("appointments")
      .insert({
        listing_id: listingId,
        requester_id: user.id,
        agent_id: agentId,
        scheduled_date: date,
        scheduled_time: time,
        location: location || null,
        message: message || null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
        <p className="mb-1 text-sm font-bold text-green-800">
          ส่งคำขอนัดเรียบร้อย!
        </p>
        <p className="text-xs text-green-600">
          รอเอเจนท์ยืนยันนัดหมาย คุณจะได้รับแจ้งเตือนเมื่อมีการตอบกลับ
        </p>
        <button
          onClick={() => router.push("/dashboard/appointments?tab=outgoing")}
          className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
        >
          ดูนัดหมายของฉัน
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Calendar size={16} className="text-teal-600" />
        นัดดูทรัพย์สิน
      </h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            วันที่
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            เวลา
          </label>
          <div className="relative">
            <Clock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
            >
              {timeSlots.map((t) => (
                <option key={t} value={t}>
                  {t} น.
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            สถานที่นัดพบ (ไม่บังคับ)
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น หน้าโครงการ, สำนักงาน"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            ข้อความ (ไม่บังคับ)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="สิ่งที่อยากสอบถามเพิ่มเติม..."
            className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#172e4a] disabled:opacity-50"
        >
          {loading ? (
            "กำลังส่ง..."
          ) : (
            <>
              <Send size={14} />
              ส่งคำขอนัดหมาย
            </>
          )}
        </button>
      </form>
    </div>
  );
}
