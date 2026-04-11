"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

export default function InteractionForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("client_interactions").insert({
      client_id: clientId,
      agent_id: user.id,
      type: form.get("type") as string,
      summary: (form.get("summary") as string) || null,
    });

    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
    } else {
      // Update last_contacted_at
      const { error: updateError } = await supabase
        .from("clients")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", clientId);

      if (updateError) {
        console.error("Failed to update last_contacted_at:", updateError);
      }

      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white py-4 text-sm font-medium text-slate-500 transition-colors hover:border-teal-400 hover:text-teal-600"
      >
        <Plus size={16} />
        บันทึกการติดต่อ
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-800">บันทึกการติดต่อ</h3>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">ประเภท</label>
          <select
            name="type"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="call">โทรศัพท์</option>
            <option value="line">LINE</option>
            <option value="meeting">ประชุม</option>
            <option value="showing">พาดูทรัพย์</option>
            <option value="email">อีเมล</option>
            <option value="note">โน้ต</option>
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">สรุป / รายละเอียด</label>
        <textarea
          name="summary"
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
          placeholder="รายละเอียดการติดต่อ..."
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : "บันทึก"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
