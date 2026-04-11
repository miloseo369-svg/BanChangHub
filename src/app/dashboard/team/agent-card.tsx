"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  UserX,
  CheckCircle2,
  XCircle,
  Phone,
  Building2,
} from "lucide-react";

export default function AgentCard({
  coAgentId,
  name,
  phone,
  role,
  companyName,
  isVerified,
  status,
  permissions,
  isPrimary,
  targetUserId,
}: {
  coAgentId: string;
  name: string;
  phone?: string;
  role?: string;
  companyName?: string | null;
  isVerified?: boolean;
  status: string;
  permissions: Record<string, boolean>;
  isPrimary: boolean;
  targetUserId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRevoke() {
    if (!window.confirm("ยกเลิก Co-Agent คนนี้?")) return;
    setLoading(true);

    const { error } = await supabase
      .from("co_agents")
      .update({ status: "revoked" })
      .eq("id", coAgentId);

    if (!error) {
      await supabase.rpc("log_activity", {
        p_action: "co_agent.revoked",
        p_entity_type: "co_agent",
        p_entity_id: coAgentId,
        p_metadata: { co_agent_name: name },
      });

      // แจ้งเตือน co-agent ที่ถูกยกเลิก
      if (targetUserId) {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "system",
          title: "สถานะ Co-Agent ถูกยกเลิก",
          message: "สิทธิ์ Co-Agent ของคุณถูกยกเลิกแล้ว",
          link: "/dashboard/team",
        });
      }

      router.refresh();
    }
    setLoading(false);
  }

  async function handleAccept() {
    setLoading(true);

    const { error } = await supabase
      .from("co_agents")
      .update({ status: "active", accepted_at: new Date().toISOString() })
      .eq("id", coAgentId);

    if (!error) {
      await supabase.rpc("log_activity", {
        p_action: "co_agent.accepted",
        p_entity_type: "co_agent",
        p_entity_id: coAgentId,
        p_metadata: { primary_agent_name: name },
      });

      // แจ้งเตือน primary agent ว่า co-agent ตอบรับแล้ว
      if (targetUserId) {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "system",
          title: "Co-Agent ตอบรับแล้ว",
          message: `Co-Agent ตอบรับคำเชิญเข้าทีมแล้ว`,
          link: "/dashboard/team",
        });
      }

      router.refresh();
    }
    setLoading(false);
  }

  async function handleDecline() {
    setLoading(true);

    const { error } = await supabase
      .from("co_agents")
      .update({ status: "revoked" })
      .eq("id", coAgentId);

    if (!error) {
      await supabase.rpc("log_activity", {
        p_action: "co_agent.declined",
        p_entity_type: "co_agent",
        p_entity_id: coAgentId,
        p_metadata: { primary_agent_name: name },
      });

      // แจ้ง primary agent
      if (targetUserId) {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "system",
          title: "Co-Agent ปฏิเสธคำเชิญ",
          message: `Co-Agent ปฏิเสธคำเชิญเข้าทีม`,
          link: "/dashboard/team",
        });
      }

      router.refresh();
    }
    setLoading(false);
  }

  const roleLabel: Record<string, string> = {
    user: "ผู้ใช้",
    agent: "ตัวแทน",
    contractor: "ผู้รับเหมา",
    admin: "แอดมิน",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
            {name.charAt(0)}
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-slate-800">
              {name}
              {isVerified && <ShieldCheck size={12} className="text-teal-500" />}
            </p>
            {companyName && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <Building2 size={10} /> {companyName}
              </p>
            )}
            {role && (
              <p className="text-[11px] text-slate-400">{roleLabel[role] ?? role}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        {status === "pending" ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Clock size={10} /> รอตอบรับ
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            <CheckCircle2 size={10} /> ใช้งาน
          </span>
        )}
      </div>

      {/* Phone */}
      {phone && (
        <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
          <Phone size={11} /> {phone}
        </p>
      )}

      {/* Permissions */}
      {status === "active" && (
        <div className="mb-3 flex flex-wrap gap-1">
          {permissions?.manage_listings && (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">ดูแลประกาศ</span>
          )}
          {permissions?.manage_appointments && (
            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-600">จัดการนัดหมาย</span>
          )}
          {permissions?.view_inquiries && (
            <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-600">ดูข้อความ</span>
          )}
        </div>
      )}

      {/* Actions */}
      {isPrimary && (
        <button
          onClick={handleRevoke}
          disabled={loading}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <UserX size={13} />
          {status === "pending" ? "ยกเลิกคำเชิญ" : "ยกเลิก Co-Agent"}
        </button>
      )}

      {!isPrimary && status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <CheckCircle2 size={13} />
            ตอบรับ
          </button>
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <XCircle size={13} />
            ปฏิเสธ
          </button>
        </div>
      )}
    </div>
  );
}
