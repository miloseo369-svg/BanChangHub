import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MessageCircle,
  Flame,
  Sun,
  Snowflake,
  CheckCircle2,
  DollarSign,
  Calendar,
  PhoneCall,
  Eye,
  StickyNote,
  Send,
} from "lucide-react";
import InteractionForm from "./interactions";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  hot: { label: "Hot", cls: "bg-red-100 text-red-700" },
  warm: { label: "Warm", cls: "bg-amber-100 text-amber-700" },
  active: { label: "Active", cls: "bg-blue-100 text-blue-700" },
  cold: { label: "Cold", cls: "bg-slate-100 text-slate-600" },
  closed: { label: "Closed", cls: "bg-green-100 text-green-700" },
};

const INTERACTION_ICONS: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  line: MessageCircle,
  meeting: Calendar,
  showing: Eye,
  note: StickyNote,
  email: Send,
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch client (RLS จะ filter ตาม agent_id อยู่แล้ว แต่เช็คซ้ำเพื่อความปลอดภัย)
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) redirect("/dashboard/crm");

  // ตรวจสอบว่าเป็นเจ้าของหรือ co-agent
  if (client.agent_id !== user.id) {
    // RLS ควรจะ block อยู่แล้ว แต่ถ้าหลุดมาให้ redirect
    const { data: isCoAgent } = await supabase
      .from("co_agents")
      .select("id")
      .eq("primary_agent_id", client.agent_id)
      .eq("co_agent_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!isCoAgent) redirect("/dashboard/crm");
  }

  // Fetch interactions
  const { data: interactions } = await supabase
    .from("client_interactions")
    .select("*, profiles:agent_id(full_name), listings:listing_id(title)")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const st = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;

  const sourceLabel: Record<string, string> = {
    website: "เว็บไซต์",
    line: "LINE",
    referral: "แนะนำ",
    "walk-in": "Walk-in",
    facebook: "Facebook",
    other: "อื่นๆ",
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <Link
        href="/dashboard/crm"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} />
        กลับ CRM
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">{client.name}</h1>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              {client.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <a href={`tel:${client.phone}`} className="hover:text-teal-600">{client.phone}</a>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <a href={`mailto:${client.email}`} className="hover:text-teal-600">{client.email}</a>
                </div>
              )}
              {client.line_id && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MessageCircle size={14} className="text-slate-400" />
                  {client.line_id}
                </div>
              )}
              {client.source && (
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  แหล่งที่มา: {sourceLabel[client.source] ?? client.source}
                </div>
              )}
            </div>

            {/* Budget */}
            {(client.budget_min || client.budget_max) && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <DollarSign size={12} /> งบประมาณ
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {client.budget_min ? `฿${Number(client.budget_min).toLocaleString()}` : "-"}
                  {" — "}
                  {client.budget_max ? `฿${Number(client.budget_max).toLocaleString()}` : "-"}
                </p>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3">
                <p className="mb-1 text-xs font-medium text-amber-700">โน้ต</p>
                <p className="text-sm text-amber-800">{client.notes}</p>
              </div>
            )}

            <p className="mt-4 text-[11px] text-slate-400">
              เพิ่มเมื่อ {new Date(client.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Interactions Timeline */}
        <div className="lg:col-span-2">
          {/* Add Interaction Form */}
          <InteractionForm clientId={id} />

          {/* Timeline */}
          <div className="mt-6">
            <h2 className="mb-4 text-sm font-bold text-slate-800">
              ประวัติการติดต่อ ({interactions?.length ?? 0})
            </h2>

            {!interactions || interactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
                <Calendar size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-500">ยังไม่มีประวัติการติดต่อ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((int) => {
                  const Icon = INTERACTION_ICONS[int.type] ?? StickyNote;
                  const agent = int.profiles as { full_name: string } | null;
                  const listing = int.listings as { title: string } | null;
                  const typeLabel: Record<string, string> = {
                    call: "โทรศัพท์",
                    line: "LINE",
                    meeting: "ประชุม",
                    showing: "พาดูทรัพย์",
                    note: "โน้ต",
                    email: "อีเมล",
                  };

                  return (
                    <div key={int.id} className="flex gap-3 rounded-lg border border-slate-100 bg-white p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Icon size={16} className="text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            {typeLabel[int.type] ?? int.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(int.created_at).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {agent && (
                            <span className="text-[10px] text-slate-400">
                              โดย {agent.full_name}
                            </span>
                          )}
                        </div>
                        {int.summary && (
                          <p className="mt-1 text-sm text-slate-600">{int.summary}</p>
                        )}
                        {listing && (
                          <p className="mt-1 text-xs text-teal-600">ทรัพย์: {listing.title}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
