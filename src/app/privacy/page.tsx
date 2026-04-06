import type { Metadata } from "next";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "นโยบายความเป็นส่วนตัว" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link href="/" className="text-slate-500 hover:text-slate-700"><ArrowLeft size={18} /></Link>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]"><Home size={16} className="text-white" /></div>
            <span className="text-xl font-extrabold"><span className="text-[#1e3a5f]">BanChang</span><span className="text-teal-600">Hub</span></span>
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">นโยบายความเป็นส่วนตัว</h1>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>BanChangHub ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้ นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลของคุณ</p>
          <h2 className="text-base font-bold text-slate-800">1. ข้อมูลที่เก็บรวบรวม</h2>
          <p>เราเก็บข้อมูลที่คุณให้เมื่อสมัครสมาชิก ลงประกาศ หรือติดต่อเรา เช่น ชื่อ อีเมล เบอร์โทร ที่อยู่</p>
          <h2 className="text-base font-bold text-slate-800">2. การใช้ข้อมูล</h2>
          <p>เราใช้ข้อมูลเพื่อให้บริการ ปรับปรุงประสบการณ์ผู้ใช้ และติดต่อคุณเกี่ยวกับบริการ</p>
          <h2 className="text-base font-bold text-slate-800">3. การแบ่งปันข้อมูล</h2>
          <p>เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม ข้อมูลติดต่อจะแสดงเฉพาะสมาชิกแพ็กเกจที่มีสิทธิ์เท่านั้น</p>
          <h2 className="text-base font-bold text-slate-800">4. การรักษาความปลอดภัย</h2>
          <p>เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ</p>
          <h2 className="text-base font-bold text-slate-800">5. สิทธิ์ของคุณ</h2>
          <p>คุณสามารถขอดู แก้ไข หรือลบข้อมูลส่วนบุคคลได้ตลอดเวลาผ่านหน้าตั้งค่า</p>
          <p className="mt-6 text-xs text-slate-400">อัปเดตล่าสุด: เมษายน 2026</p>
        </div>
      </div>
    </div>
  );
}
