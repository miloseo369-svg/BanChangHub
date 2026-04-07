import { requireAdmin } from "@/lib/admin";
import { MessageCircle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export default async function AdminLinePage() {
  await requireAdmin();

  const isConfigured = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.vercel.app"}/api/line/webhook`;

  return (
    <div className="px-4 py-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-800">LINE Bot Settings</h1>

      {/* Status */}
      <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-5 ${isConfigured ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
        {isConfigured ? (
          <CheckCircle2 size={24} className="text-green-500" />
        ) : (
          <XCircle size={24} className="text-amber-500" />
        )}
        <div>
          <p className={`text-sm font-bold ${isConfigured ? "text-green-800" : "text-amber-800"}`}>
            {isConfigured ? "LINE Bot เชื่อมต่อแล้ว" : "ยังไม่ได้ตั้งค่า LINE Bot"}
          </p>
          <p className="text-xs text-slate-500">
            {isConfigured ? "ระบบพร้อมรับ-ส่งข้อความผ่าน LINE" : "ต้องใส่ LINE Channel Access Token ใน Environment Variables"}
          </p>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <MessageCircle size={18} className="text-green-500" />
            วิธีตั้งค่า LINE Bot
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-700">ขั้นตอนที่ 1: สร้าง LINE Official Account</h3>
              <ol className="space-y-1.5 text-xs text-slate-600">
                <li>1. ไปที่ <a href="https://developers.line.biz" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline">LINE Developers Console <ExternalLink size={10} className="inline" /></a></li>
                <li>2. สร้าง Provider ใหม่ (เช่น "BanChangHub")</li>
                <li>3. สร้าง Channel ประเภท <strong>Messaging API</strong></li>
                <li>4. ตั้งชื่อ Bot เช่น "BanChangHub"</li>
              </ol>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-700">ขั้นตอนที่ 2: เอา Keys มาใส่</h3>
              <p className="mb-2 text-xs text-slate-600">เพิ่ม Environment Variables ใน Vercel:</p>
              <div className="space-y-2 rounded-lg bg-slate-800 p-3 font-mono text-xs text-green-400">
                <p>LINE_CHANNEL_ACCESS_TOKEN=<span className="text-slate-500">your-token</span></p>
                <p>LINE_CHANNEL_SECRET=<span className="text-slate-500">your-secret</span></p>
                <p>CRON_SECRET=<span className="text-slate-500">random-secret-for-cron</span></p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-700">ขั้นตอนที่ 3: ตั้ง Webhook URL</h3>
              <p className="mb-2 text-xs text-slate-600">ใน LINE Developers → Messaging API → Webhook URL ใส่:</p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 font-mono text-xs text-green-400">
                <span className="flex-1 truncate">{webhookUrl}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">เปิด "Use webhook" → Verify → สำเร็จ</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-700">ขั้นตอนที่ 4: Redeploy</h3>
              <p className="text-xs text-slate-600">
                หลังใส่ env vars แล้ว redeploy Vercel: <code className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px]">npx vercel deploy --prod</code>
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-800">ฟีเจอร์ที่พร้อมใช้</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "ค้นหาทรัพย์สิน", desc: "ลูกค้าพิมพ์ \"หา บ้านอุดร\" ได้เลย", status: isConfigured },
              { title: "เตือนนัดหมาย", desc: "ส่ง LINE ทุกเช้าวันที่มีนัด", status: isConfigured },
              { title: "ส่ง Listing", desc: "เอเจนท์ส่งรายละเอียดทรัพย์สินให้ลูกค้า", status: isConfigured },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-100 p-4">
                <div className="mb-1 flex items-center gap-2">
                  {f.status ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
                  )}
                  <span className="text-sm font-bold text-slate-800">{f.title}</span>
                </div>
                <p className="text-[11px] text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
