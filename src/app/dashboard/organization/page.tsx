"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Users,
  Crown,
  Shield,
  User,
  Loader2,
  Trash2,
} from "lucide-react";

interface Org {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { full_name: string; phone: string; role: string } | null;
}

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<(Org & { members: OrgMember[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOrgs() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get orgs where user is a member
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setLoading(false);
      return;
    }

    const orgIds = memberships.map((m) => m.org_id);

    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .in("id", orgIds);

    // Fetch members for each org
    const results = [];
    for (const org of orgData ?? []) {
      const { data: members } = await supabase
        .from("organization_members")
        .select("*, profiles:user_id(full_name, phone, role)")
        .eq("org_id", org.id)
        .order("joined_at");

      results.push({ ...org, members: members ?? [] });
    }

    setOrgs(results);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);

    const form = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newOrg, error } = await supabase
      .from("organizations")
      .insert({
        name: form.get("name") as string,
        description: (form.get("description") as string) || null,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (error || !newOrg) {
      alert("สร้างไม่สำเร็จ: " + error?.message);
      setCreating(false);
      return;
    }

    // Add owner as member
    await supabase.from("organization_members").insert({
      org_id: newOrg.id,
      user_id: user.id,
      role: "owner",
    });

    setShowForm(false);
    setCreating(false);
    fetchOrgs();
  }

  const roleIcon: Record<string, typeof Crown> = {
    owner: Crown,
    manager: Shield,
    member: User,
  };
  const roleLabel: Record<string, string> = {
    owner: "เจ้าของ",
    manager: "ผู้จัดการ",
    member: "สมาชิก",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Building2 size={24} className="text-teal-600" />
          องค์กร / ทีม
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={16} />
          สร้างองค์กร
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">สร้างองค์กรใหม่</h3>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">ชื่อองค์กร *</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="เช่น BanChang Property Team"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">รายละเอียด</label>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="ทีมงานอสังหาริมทรัพย์..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : "สร้าง"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {/* Org List */}
      {orgs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">ยังไม่มีองค์กร</p>
          <p className="mt-1 text-xs text-slate-400">สร้างองค์กรเพื่อรวมทีมงาน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{org.name}</h2>
                  {org.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{org.description}</p>
                  )}
                </div>
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                  <Users size={11} /> {org.members.length} คน
                </span>
              </div>

              <div className="space-y-2">
                {org.members.map((m) => {
                  const RoleIcon = roleIcon[m.role] ?? User;
                  const profile = m.profiles;
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                          {(profile?.full_name ?? "?").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{profile?.full_name ?? "-"}</p>
                          <p className="text-[11px] text-slate-400">{profile?.phone}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <RoleIcon size={12} />
                        {roleLabel[m.role]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
