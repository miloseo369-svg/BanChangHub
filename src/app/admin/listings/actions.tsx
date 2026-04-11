"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Check, X, MoreVertical, Eye, Ban, RotateCcw } from "lucide-react";

export default function AdminListingActions({
  listingId,
  status,
  listingCode,
}: {
  listingId: string;
  status: string;
  listingCode?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setShowMenu(false);

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "active") {
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", listingId);

    if (!error) {
      // Log activity
      const action =
        newStatus === "active"
          ? "listing.approved"
          : newStatus === "rejected"
            ? "listing.rejected"
            : "listing.status_changed";

      await supabase.rpc("log_activity", {
        p_action: action,
        p_entity_type: "listing",
        p_entity_id: listingId,
        p_metadata: {
          listing_code: listingCode,
          old_status: status,
          new_status: newStatus,
        },
      });

      // แจ้งเตือนเจ้าของประกาศ
      const { data: listing } = await supabase
        .from("listings")
        .select("user_id, title")
        .eq("id", listingId)
        .single();

      if (listing) {
        if (newStatus === "active" && status === "pending") {
          await supabase.from("notifications").insert({
            user_id: listing.user_id,
            type: "listing_approved",
            title: "ประกาศได้รับการอนุมัติ",
            message: `"${listing.title}" เผยแพร่บนเว็บไซต์แล้ว`,
            link: `/listings/${listingId}`,
          });
        } else if (newStatus === "rejected") {
          await supabase.from("notifications").insert({
            user_id: listing.user_id,
            type: "listing_rejected",
            title: "ประกาศถูกปฏิเสธ",
            message: `"${listing.title}" ถูกปฏิเสธ กรุณาตรวจสอบและแก้ไข`,
            link: "/dashboard/listings",
          });
        }
      }

      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="relative flex items-center gap-1">
      {/* Quick approve/reject for pending */}
      {status === "pending" && (
        <>
          <button
            onClick={() => updateStatus("active")}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
            title="อนุมัติ"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => updateStatus("rejected")}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
            title="ปฏิเสธ"
          >
            <X size={14} />
          </button>
        </>
      )}

      {/* More menu */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50"
      >
        <MoreVertical size={14} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <a
              href={`/listings/${listingId}`}
              target="_blank"
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Eye size={13} /> ดูประกาศ
            </a>
            {status !== "active" && (
              <button
                onClick={() => updateStatus("active")}
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-green-600 hover:bg-green-50"
              >
                <Check size={13} /> อนุมัติ
              </button>
            )}
            {status === "active" && (
              <button
                onClick={() => updateStatus("expired")}
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-amber-600 hover:bg-amber-50"
              >
                <Ban size={13} /> ระงับ
              </button>
            )}
            {status === "rejected" && (
              <button
                onClick={() => updateStatus("pending")}
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
              >
                <RotateCcw size={13} /> ส่งตรวจใหม่
              </button>
            )}
            {status !== "rejected" && status !== "pending" && (
              <button
                onClick={() => updateStatus("rejected")}
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
              >
                <X size={13} /> ปฏิเสธ
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
