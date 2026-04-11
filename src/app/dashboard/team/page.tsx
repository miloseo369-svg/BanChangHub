import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Users, UserPlus, Shield, Clock, Crown } from "lucide-react";
import InviteForm from "./invite-form";
import AgentCard from "./agent-card";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Fetch subscription & package info for co-agent limit
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, packages:package_id(name, max_co_agents)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const pkg = subscription?.packages as { name: string; max_co_agents: number } | null;
  const maxCoAgents = pkg?.max_co_agents ?? 0;

  // Fetch my co-agents (ฉันเป็น primary agent)
  const { data: myCoAgents } = await supabase
    .from("co_agents")
    .select("*, profiles:co_agent_id(id, full_name, phone, avatar_url, role, is_verified)")
    .eq("primary_agent_id", user.id)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  // Fetch teams I belong to (ฉันเป็น co-agent)
  const { data: myTeams } = await supabase
    .from("co_agents")
    .select("*, profiles:primary_agent_id(id, full_name, phone, avatar_url, company_name, role)")
    .eq("co_agent_id", user.id)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  const currentCount = (myCoAgents ?? []).length;
  const canInvite = currentCount < maxCoAgents;

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Users size={24} className="text-teal-600" />
          จัดการทีม
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          จัดการ Co-Agent ที่ช่วยดูแลทรัพย์สินของคุณ
        </p>
      </div>

      {/* Package Info */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              แพ็กเกจ: {pkg?.name ?? "ฟรี"}
            </p>
            <p className="text-xs text-slate-500">
              Co-Agent: {currentCount}/{maxCoAgents} คน
            </p>
          </div>
          {maxCoAgents === 0 && (
            <a
              href="/dashboard/packages"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              อัปเกรดเพื่อเพิ่ม Co-Agent
            </a>
          )}
        </div>
        {maxCoAgents > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${Math.min(100, (currentCount / maxCoAgents) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Invite Form */}
      {maxCoAgents > 0 && (
        <div className="mb-6">
          <InviteForm canInvite={canInvite} />
        </div>
      )}

      {/* My Co-Agents */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Crown size={18} className="text-amber-500" />
          Co-Agent ของฉัน ({(myCoAgents ?? []).length})
        </h2>

        {!myCoAgents || myCoAgents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
            <UserPlus size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-500">ยังไม่มี Co-Agent</p>
            {maxCoAgents > 0 && (
              <p className="mt-1 text-xs text-slate-400">เชิญสมาชิกเพื่อช่วยดูแลทรัพย์สินร่วมกัน</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myCoAgents.map((ca) => {
              const agent = ca.profiles as {
                id: string;
                full_name: string;
                phone: string;
                avatar_url: string | null;
                role: string;
                is_verified: boolean;
              };
              return (
                <AgentCard
                  key={ca.id}
                  coAgentId={ca.id}
                  name={agent?.full_name ?? "ไม่มีชื่อ"}
                  phone={agent?.phone}
                  role={agent?.role}
                  isVerified={agent?.is_verified}
                  status={ca.status}
                  permissions={ca.permissions}
                  isPrimary={true}
                  targetUserId={agent?.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Teams I belong to */}
      {myTeams && myTeams.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <Shield size={18} className="text-blue-500" />
            ทีมที่ฉันเป็นสมาชิก ({myTeams.length})
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myTeams.map((team) => {
              const primary = team.profiles as {
                id: string;
                full_name: string;
                phone: string;
                avatar_url: string | null;
                company_name: string | null;
                role: string;
              };
              return (
                <AgentCard
                  key={team.id}
                  coAgentId={team.id}
                  name={primary?.full_name ?? "ไม่มีชื่อ"}
                  phone={primary?.phone}
                  role={primary?.role}
                  companyName={primary?.company_name}
                  status={team.status}
                  permissions={team.permissions}
                  isPrimary={false}
                  targetUserId={primary?.id}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
