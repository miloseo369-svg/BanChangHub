"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Zap, Crown, Clock, Check } from "lucide-react";

export default function BoostButton({
  listingId,
  isBoosted,
  boostExpiresAt,
  canBoost,
}: {
  listingId: string;
  isBoosted: boolean;
  boostExpiresAt: string | null;
  canBoost: boolean; // มีแพ็กเกจที่รองรับ boost
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const isExpired = boostExpiresAt
    ? new Date(boostExpiresAt) < new Date()
    : true;
  const isActive = isBoosted && !isExpired;

  async function handleBoost(days: number) {
    setLoading(true);
    setShowConfirm(false);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        is_boosted: true,
        boost_expires_at: expiresAt.toISOString(),
      })
      .eq("id", listingId);

    if (updateError) {
      setError("บูสต์ไม่สำเร็จ: " + updateError.message);
    } else {
      setError("");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUnboost() {
    setLoading(true);
    setShowConfirm(false);

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        is_boosted: false,
        boost_expires_at: null,
      })
      .eq("id", listingId);

    if (updateError) {
      setError("ยกเลิกบูสต์ไม่สำเร็จ: " + updateError.message);
    } else {
      setError("");
      router.refresh();
    }
    setLoading(false);
  }

  // ยังไม่มีแพ็กเกจ → แสดงปุ่ม upgrade
  if (!canBoost) {
    return (
      <a
        href="/dashboard/packages"
        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
      >
        <Crown size={13} />
        อัปเกรดเพื่อบูสต์
      </a>
    );
  }

  // กำลังบูสต์อยู่
  if (isActive) {
    const remaining = boostExpiresAt
      ? Math.ceil(
          (new Date(boostExpiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return (
      <div className="relative">
        <button
          onClick={() => setShowConfirm(!showConfirm)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-700"
        >
          <Zap size={13} className="text-amber-500" />
          บูสต์อยู่ ({remaining} วัน)
        </button>

        {showConfirm && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowConfirm(false)}
            />
            <div className="absolute right-0 top-9 z-20 w-48 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <p className="mb-2 text-xs font-medium text-slate-700">
                จัดการบูสต์
              </p>
              <button
                onClick={() => handleBoost(7)}
                disabled={loading}
                className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                <Clock size={12} />
                ต่ออายุ 7 วัน
              </button>
              <button
                onClick={handleUnboost}
                disabled={loading}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                ยกเลิกบูสต์
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ยังไม่ได้บูสต์ → เลือกระยะเวลา
  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-50"
      >
        <Zap size={13} />
        {loading ? "กำลังบูสต์..." : "บูสต์"}
      </button>

      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowConfirm(false)}
          />
          <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-1 text-xs font-bold text-slate-800">
              เลือกระยะเวลาบูสต์
            </p>
            <p className="mb-3 text-[11px] text-slate-500">
              ประกาศจะแสดงด้านบนสุดในหน้าแรก
            </p>
            <div className="space-y-1.5">
              {[
                { days: 3, label: "3 วัน" },
                { days: 7, label: "7 วัน" },
                { days: 14, label: "14 วัน" },
                { days: 30, label: "30 วัน" },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => handleBoost(opt.days)}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-xs transition-colors hover:border-teal-300 hover:bg-teal-50 disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Zap size={12} className="text-teal-500" />
                    {opt.label}
                  </span>
                  <Check size={12} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
