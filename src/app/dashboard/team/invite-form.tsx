"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { UserPlus, Search, Loader2 } from "lucide-react";

export default function InviteForm({ canInvite }: { canInvite: boolean }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [foundUser, setFoundUser] = useState<{
    id: string;
    full_name: string;
    phone: string;
    role: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSearch() {
    if (!search.trim()) return;
    setLoading(true);
    setError("");
    setFoundUser(null);

    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .or(`phone.eq.${search.trim()},full_name.ilike.%${search.trim()}%`)
      .limit(1);

    if (!users || users.length === 0) {
      setError("ไม่พบผู้ใช้ ลองค้นหาด้วยเบอร์โทรหรือชื่อ");
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (users[0].id === user?.id) {
        setError("ไม่สามารถเชิญตัวเองได้");
      } else {
        setFoundUser(users[0]);
      }
    }
    setLoading(false);
  }

  async function handleInvite() {
    if (!foundUser) return;
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already invited
    const { data: existing } = await supabase
      .from("co_agents")
      .select("id, status")
      .eq("primary_agent_id", user.id)
      .eq("co_agent_id", foundUser.id)
      .in("status", ["pending", "active"])
      .limit(1);

    if (existing && existing.length > 0) {
      setError("ผู้ใช้นี้ได้รับเชิญแล้ว");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("co_agents").insert({
      primary_agent_id: user.id,
      co_agent_id: foundUser.id,
    });

    if (insertError) {
      setError("เชิญไม่สำเร็จ: " + insertError.message);
    } else {
      // Send notification
      await supabase.from("notifications").insert({
        user_id: foundUser.id,
        type: "system",
        title: "คำเชิญเป็น Co-Agent",
        message: "คุณได้รับเชิญให้เป็น Co-Agent — กดเพื่อดูรายละเอียด",
        link: "/dashboard/team",
      });

      await supabase.rpc("log_activity", {
        p_action: "co_agent.invited",
        p_entity_type: "co_agent",
        p_entity_id: foundUser.id,
        p_metadata: { co_agent_name: foundUser.full_name },
      });

      setSuccess(`เชิญ ${foundUser.full_name} สำเร็จ!`);
      setFoundUser(null);
      setSearch("");
      router.refresh();
      setTimeout(() => setSuccess(""), 3000);
    }
    setLoading(false);
  }

  if (!canInvite) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm font-medium text-amber-800">Co-Agent เต็มจำนวนแล้ว</p>
        <p className="mt-1 text-xs text-amber-600">อัปเกรดแพ็กเกจเพื่อเพิ่ม Co-Agent ได้มากขึ้น</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <UserPlus size={16} className="text-teal-600" />
        เชิญ Co-Agent
      </h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-600">{success}</div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="ค้นหาด้วยเบอร์โทรหรือชื่อ..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !search.trim()}
          className="shrink-0 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "ค้นหา"}
        </button>
      </div>

      {/* Found user */}
      {foundUser && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{foundUser.full_name}</p>
            <p className="text-xs text-slate-500">{foundUser.phone} / {foundUser.role}</p>
          </div>
          <button
            onClick={handleInvite}
            disabled={loading}
            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : "เชิญเข้าทีม"}
          </button>
        </div>
      )}
    </div>
  );
}
