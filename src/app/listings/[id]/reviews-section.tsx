"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Star, Send, User } from "lucide-react";

export default function ReviewsSection({
  listingId,
  targetUserId,
  isLoggedIn,
}: {
  listingId: string;
  targetUserId: string;
  isLoggedIn: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [reviews, setReviews] = useState<
    { id: string; rating: number; comment: string; created_at: string; reviewer: { full_name: string } | null }[]
  >([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer:reviewer_id(full_name)")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setReviews(
          data.map((r) => ({
            ...r,
            reviewer: r.reviewer as unknown as { full_name: string } | null,
          }))
        );
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id === targetUserId) {
      setError("ไม่สามารถรีวิวตัวเองได้");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      target_id: targetUserId,
      listing_id: listingId,
      rating,
      comment: comment.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setComment("");
      setRating(5);
      router.refresh();
      // Reload reviews
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer:reviewer_id(full_name)")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        setReviews(
          data.map((r) => ({
            ...r,
            reviewer: r.reviewer as unknown as { full_name: string } | null,
          }))
        );
      }
    }
    setLoading(false);
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">
          รีวิว ({reviews.length})
        </h2>
        {avgRating && (
          <div className="flex items-center gap-1 text-sm">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{avgRating}</span>
          </div>
        )}
      </div>

      {/* Review list */}
      {reviews.length > 0 && (
        <div className="mb-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                    {r.reviewer?.full_name?.charAt(0) ?? "?"}
                  </div>
                  <span className="text-xs font-medium text-slate-700">
                    {r.reviewer?.full_name ?? "ผู้ใช้"}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-xs text-slate-600">{r.comment}</p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">
                {new Date(r.created_at).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Submit form */}
      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-3">
          {error && (
            <p className="mb-2 text-xs text-red-600">{error}</p>
          )}
          <div className="mb-2 flex items-center gap-1">
            <span className="mr-1 text-xs text-slate-500">คะแนน:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-0.5"
              >
                <Star
                  size={16}
                  className={s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เขียนรีวิว..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Send size={12} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
