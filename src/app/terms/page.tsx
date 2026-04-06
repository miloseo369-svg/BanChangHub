import type { Metadata } from "next";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "ข้อกำหนดการใช้งาน" };

export default function TermsPage() {
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
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">ข้อกำหนดการใช้งาน</h1>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>ยินดีต้อนรับสู่ BanChangHub แพลตฟอร์มอสังหาริมทรัพย์และรับเหมาก่อสร้างสำหรับอีสานตอนบน การใช้งานเว็บไซต์นี้ถือว่าคุณยอมรับข้อกำหนดต่อไปนี้</p>
          <h2 className="text-base font-bold text-slate-800">1. การใช้บริการ</h2>
          <p>ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและเป็นจริงในการลงทะเบียนและลงประกาศ ห้ามใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</p>
          <h2 className="text-base font-bold text-slate-800">2. เนื้อหาและประกาศ</h2>
          <p>ผู้ลงประกาศรับผิดชอบต่อความถูกต้องของข้อมูล BanChangHub ขอสงวนสิทธิ์ในการลบประกาศที่ไม่เหมาะสม</p>
          <h2 className="text-base font-bold text-slate-800">3. ความเป็นส่วนตัว</h2>
          <p>เราเก็บรักษาข้อมูลส่วนบุคคลตามนโยบายความเป็นส่วนตัวของเรา</p>
          <h2 className="text-base font-bold text-slate-800">4. ข้อจำกัดความรับผิดชอบ</h2>
          <p>BanChangHub เป็นแพลตฟอร์มตัวกลาง ไม่รับผิดชอบต่อข้อพิพาทระหว่างผู้ซื้อและผู้ขาย</p>
          <p className="mt-6 text-xs text-slate-400">อัปเดตล่าสุด: เมษายน 2026</p>
        </div>
      </div>
    </div>
  );
}
