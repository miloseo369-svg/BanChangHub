"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function FavoriteButton({
  listingId,
  isFavorited,
  isLoggedIn,
}: {
  listingId: string;
  isFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      if (favorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (!error) {
          setFavorited(false);
        }
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (!error) {
          setFavorited(true);
        }
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg border p-2 transition-colors disabled:opacity-50 ${
        favorited
          ? "border-red-200 bg-red-50 text-red-500"
          : "border-slate-200 text-slate-500 hover:bg-slate-50"
      }`}
      title={favorited ? "ยกเลิกบันทึก" : "บันทึก"}
    >
      <Heart size={16} fill={favorited ? "currentColor" : "none"} />
    </button>
  );
}
