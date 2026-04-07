"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  ArrowLeft,
  FileText,
  Download,
  Building2,
  HandshakeIcon,
  Printer,
} from "lucide-react";

// แปลงตัวเลขเป็นคำอ่านภาษาไทย (สำหรับสัญญา)
function toThaiWords(n: number): string {
  if (n === 0) return "ศูนย์บาทถ้วน";
  const units = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  let str = "";
  const numStr = Math.floor(n).toString();
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(numStr[i]);
    const pos = len - i - 1;
    if (digit === 0) continue;
    if (pos === 1 && digit === 1) str += "สิบ";
    else if (pos === 1 && digit === 2) str += "ยี่สิบ";
    else if (pos === 0 && digit === 1 && len > 1) str += "เอ็ด";
    else str += units[digit] + positions[pos];
  }
  return str + "บาทถ้วน";
}

const CONTRACT_TYPES = [
  { id: "sale", label: "สัญญาซื้อขาย", icon: HandshakeIcon, color: "from-teal-500 to-emerald-600" },
  { id: "rent", label: "สัญญาเช่า", icon: Building2, color: "from-sky-500 to-blue-600" },
  { id: "transfer", label: "สัญญาเซ้ง", icon: FileText, color: "from-amber-500 to-orange-600" },
];

export default function ContractsPage() {
  const [type, setType] = useState("sale");
  const [form, setForm] = useState({
    sellerName: "",
    sellerIdCard: "",
    sellerAddress: "",
    buyerName: "",
    buyerIdCard: "",
    buyerAddress: "",
    propertyTitle: "",
    propertyAddress: "",
    price: "",
    deposit: "",
    transferDate: "",
    contractDate: new Date().toISOString().slice(0, 10),
    // Rent-specific
    rentPerMonth: "",
    rentStartDate: "",
    rentEndDate: "",
    rentDeposit: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePrint() {
    window.print();
  }

  const typeLabels: Record<string, { seller: string; buyer: string; action: string }> = {
    sale: { seller: "ผู้ขาย", buyer: "ผู้ซื้อ", action: "ซื้อขาย" },
    rent: { seller: "ผู้ให้เช่า", buyer: "ผู้เช่า", action: "เช่า" },
    transfer: { seller: "ผู้โอน", buyer: "ผู้รับโอน", action: "เซ้ง" },
  };

  const labels = typeLabels[type];

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20";
  const labelClass = "mb-1 block text-xs font-semibold text-slate-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#faf9f6] to-teal-50/30">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e3a5f] to-teal-700">
                <Home size={14} className="text-white" />
              </div>
              <span className="text-lg font-extrabold">
                <span className="text-[#1e3a5f]">BanChang</span>
                <span className="text-teal-600">Hub</span>
              </span>
            </Link>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Printer size={14} /> พิมพ์ / บันทึก PDF
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Type Selector */}
        <div className="mb-6 print:hidden">
          <h1 className="mb-4 text-xl font-extrabold text-slate-800">สร้างสัญญา</h1>
          <div className="grid grid-cols-3 gap-3">
            {CONTRACT_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setType(ct.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                  type === ct.id
                    ? "border-teal-500 bg-teal-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ct.color} text-white`}>
                  <ct.icon size={18} />
                </div>
                <span className="text-xs font-bold text-slate-800">{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 print:block lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-4 print:hidden">
            {/* Contract Date */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-800">วันที่ทำสัญญา</h3>
              <input type="date" value={form.contractDate} onChange={(e) => update("contractDate", e.target.value)} className={inputClass} />
            </div>

            {/* Seller */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-teal-700">{labels.seller}</h3>
              <div className="space-y-3">
                <div><label className={labelClass}>ชื่อ-นามสกุล</label><input value={form.sellerName} onChange={(e) => update("sellerName", e.target.value)} placeholder="นาย/นาง..." className={inputClass} /></div>
                <div><label className={labelClass}>เลขบัตรประชาชน</label><input value={form.sellerIdCard} onChange={(e) => update("sellerIdCard", e.target.value)} placeholder="X-XXXX-XXXXX-XX-X" className={inputClass} /></div>
                <div><label className={labelClass}>ที่อยู่</label><input value={form.sellerAddress} onChange={(e) => update("sellerAddress", e.target.value)} placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด" className={inputClass} /></div>
              </div>
            </div>

            {/* Buyer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-sky-700">{labels.buyer}</h3>
              <div className="space-y-3">
                <div><label className={labelClass}>ชื่อ-นามสกุล</label><input value={form.buyerName} onChange={(e) => update("buyerName", e.target.value)} placeholder="นาย/นาง..." className={inputClass} /></div>
                <div><label className={labelClass}>เลขบัตรประชาชน</label><input value={form.buyerIdCard} onChange={(e) => update("buyerIdCard", e.target.value)} placeholder="X-XXXX-XXXXX-XX-X" className={inputClass} /></div>
                <div><label className={labelClass}>ที่อยู่</label><input value={form.buyerAddress} onChange={(e) => update("buyerAddress", e.target.value)} placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด" className={inputClass} /></div>
              </div>
            </div>

            {/* Property + Price */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-800">ทรัพย์สิน & ราคา</h3>
              <div className="space-y-3">
                <div><label className={labelClass}>ชื่อทรัพย์สิน</label><input value={form.propertyTitle} onChange={(e) => update("propertyTitle", e.target.value)} placeholder="บ้านเดี่ยว 2 ชั้น เลขที่..." className={inputClass} /></div>
                <div><label className={labelClass}>ที่ตั้งทรัพย์สิน</label><input value={form.propertyAddress} onChange={(e) => update("propertyAddress", e.target.value)} placeholder="ที่อยู่ทรัพย์สิน" className={inputClass} /></div>
                {type === "rent" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelClass}>ค่าเช่า/เดือน (บาท)</label><input type="number" value={form.rentPerMonth} onChange={(e) => update("rentPerMonth", e.target.value)} placeholder="0" className={inputClass} /></div>
                      <div><label className={labelClass}>เงินประกัน (บาท)</label><input type="number" value={form.rentDeposit} onChange={(e) => update("rentDeposit", e.target.value)} placeholder="0" className={inputClass} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelClass}>วันเริ่มเช่า</label><input type="date" value={form.rentStartDate} onChange={(e) => update("rentStartDate", e.target.value)} className={inputClass} /></div>
                      <div><label className={labelClass}>วันสิ้นสุด</label><input type="date" value={form.rentEndDate} onChange={(e) => update("rentEndDate", e.target.value)} className={inputClass} /></div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>ราคา{labels.action} (บาท)</label><input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" className={inputClass} /></div>
                    <div><label className={labelClass}>เงินมัดจำ (บาท)</label><input type="number" value={form.deposit} onChange={(e) => update("deposit", e.target.value)} placeholder="0" className={inputClass} /></div>
                  </div>
                )}
                {type !== "rent" && (
                  <div><label className={labelClass}>วันโอนกรรมสิทธิ์</label><input type="date" value={form.transferDate} onChange={(e) => update("transferDate", e.target.value)} className={inputClass} /></div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
            <div className="text-center">
              <h2 className="mb-1 text-lg font-bold text-slate-800">
                สัญญา{labels.action}{type === "rent" ? "ทรัพย์สิน" : "อสังหาริมทรัพย์"}
              </h2>
              <p className="mb-6 text-xs text-slate-500">
                วันที่ {form.contractDate ? new Date(form.contractDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "_______________"}
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>{form.sellerName || "_______________"}</strong> เลขบัตรประชาชน {form.sellerIdCard || "_____________"} อยู่ที่ {form.sellerAddress || "_______________"} ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>&quot;{labels.seller}&quot;</strong> ฝ่ายหนึ่ง
              </p>

              <p>
                กับ <strong>{form.buyerName || "_______________"}</strong> เลขบัตรประชาชน {form.buyerIdCard || "_____________"} อยู่ที่ {form.buyerAddress || "_______________"} ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>&quot;{labels.buyer}&quot;</strong> อีกฝ่ายหนึ่ง
              </p>

              <p>
                ทั้งสองฝ่ายตกลงทำสัญญา{labels.action} โดยมีข้อความดังต่อไปนี้:
              </p>

              {/* ─── สัญญาเช่า (ป.พ.พ. มาตรา 537-571) ─── */}
              {type === "rent" ? (
                <>
                  <p className="font-bold">ข้อ 1. ทรัพย์สินที่เช่า</p>
                  <p>
                    ผู้ให้เช่าเป็นเจ้าของกรรมสิทธิ์/ผู้มีสิทธิครอบครองทรัพย์สิน คือ <strong>{form.propertyTitle || "_______________"}</strong> ตั้งอยู่ที่ {form.propertyAddress || "_______________"} ผู้ให้เช่าตกลงให้ผู้เช่าใช้ประโยชน์ในทรัพย์สินดังกล่าว และผู้เช่าตกลงเช่าทรัพย์สินดังกล่าวตามเงื่อนไขในสัญญานี้
                  </p>

                  <p className="font-bold">ข้อ 2. ระยะเวลาการเช่า</p>
                  <p>
                    สัญญาเช่ามีกำหนดระยะเวลา ตั้งแต่วันที่ {form.rentStartDate ? new Date(form.rentStartDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "_______________"} ถึงวันที่ {form.rentEndDate ? new Date(form.rentEndDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "_______________"} ทั้งนี้ สัญญาเช่าอสังหาริมทรัพย์ที่มีกำหนดเกิน 3 ปี ต้องจดทะเบียนต่อพนักงานเจ้าหน้าที่ มิฉะนั้นจะบังคับได้เพียง 3 ปี (ป.พ.พ. มาตรา 538)
                  </p>

                  <p className="font-bold">ข้อ 3. อัตราค่าเช่าและกำหนดชำระ</p>
                  <p>
                    ผู้เช่าตกลงชำระค่าเช่าในอัตราเดือนละ <strong>{form.rentPerMonth ? `${Number(form.rentPerMonth).toLocaleString()} บาท (${toThaiWords(Number(form.rentPerMonth))})` : "_______________"}</strong> โดยชำระค่าเช่าล่วงหน้าภายในวันที่ 5 ของทุกเดือน หากผู้เช่าผิดนัดชำระค่าเช่าเกิน 15 วัน ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาได้ (ป.พ.พ. มาตรา 560)
                  </p>

                  <p className="font-bold">ข้อ 4. เงินประกันการเช่า</p>
                  <p>
                    ผู้เช่าวางเงินประกันจำนวน <strong>{form.rentDeposit ? `${Number(form.rentDeposit).toLocaleString()} บาท (${toThaiWords(Number(form.rentDeposit))})` : "_______________"}</strong> ไว้แก่ผู้ให้เช่าในวันทำสัญญา เงินประกันนี้ผู้ให้เช่าจะคืนให้ผู้เช่าเมื่อสัญญาสิ้นสุดและผู้เช่าได้ส่งมอบทรัพย์สินคืนในสภาพเรียบร้อย หักค่าเสียหาย (ถ้ามี)
                  </p>

                  <p className="font-bold">ข้อ 5. หน้าที่ของผู้เช่า</p>
                  <p>
                    ผู้เช่าจะต้อง (1) ใช้ทรัพย์สินเช่าตามปกติ ดูแลรักษาเสมือนวิญญูชนจะพึงสงวนของตนเอง (ป.พ.พ. มาตรา 553) (2) ไม่ดัดแปลง ต่อเติม หรือเปลี่ยนแปลงทรัพย์สินโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า (3) ไม่นำทรัพย์สินไปให้ผู้อื่นเช่าช่วงโดยไม่ได้รับความยินยอม (ป.พ.พ. มาตรา 544) (4) ชำระค่าสาธารณูปโภค ได้แก่ ค่าน้ำ ค่าไฟ ค่าโทรศัพท์ และค่าบริการอื่นๆ ที่เกิดขึ้นระหว่างการเช่า
                  </p>

                  <p className="font-bold">ข้อ 6. การซ่อมแซม</p>
                  <p>
                    การซ่อมแซมเล็กน้อยเป็นหน้าที่ของผู้เช่า ส่วนการซ่อมแซมใหญ่เป็นหน้าที่ของผู้ให้เช่า (ป.พ.พ. มาตรา 550-551)
                  </p>

                  <p className="font-bold">ข้อ 7. การเลิกสัญญา</p>
                  <p>
                    ฝ่ายใดประสงค์จะเลิกสัญญาก่อนครบกำหนด ต้องแจ้งให้อีกฝ่ายทราบเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 30 วัน หากผู้เช่าเลิกสัญญาก่อนกำหนดโดยไม่มีเหตุอันสมควร ผู้ให้เช่ามีสิทธิริบเงินประกัน
                  </p>

                  <p className="font-bold">ข้อ 8. การส่งมอบคืนทรัพย์สิน</p>
                  <p>
                    เมื่อสัญญาสิ้นสุดลง ผู้เช่าต้องส่งมอบทรัพย์สินคืนในสภาพเรียบร้อย ยกเว้นการเสื่อมสภาพจากการใช้งานตามปกติ (ป.พ.พ. มาตรา 561)
                  </p>
                </>
              ) : type === "sale" ? (
                <>
                  {/* ─── สัญญาจะซื้อจะขาย (ป.พ.พ. มาตรา 453-490) ─── */}
                  <p className="font-bold">ข้อ 1. ทรัพย์สินที่จะซื้อจะขาย</p>
                  <p>
                    ผู้ขายเป็นเจ้าของกรรมสิทธิ์ในทรัพย์สิน คือ <strong>{form.propertyTitle || "_______________"}</strong> ตั้งอยู่ที่ {form.propertyAddress || "_______________"} ผู้ขายตกลงจะขายและผู้ซื้อตกลงจะซื้อทรัพย์สินดังกล่าว พร้อมสิ่งปลูกสร้างและส่วนควบทั้งหมด
                  </p>

                  <p className="font-bold">ข้อ 2. ราคาซื้อขายและการชำระเงิน</p>
                  <p>
                    ราคาซื้อขายตกลงกันเป็นจำนวน <strong>{form.price ? `${Number(form.price).toLocaleString()} บาท (${toThaiWords(Number(form.price))})` : "_______________"}</strong> โดยผู้ซื้อตกลงชำระดังนี้:
                  </p>
                  <p className="pl-4">
                    (ก) วางเงินมัดจำในวันทำสัญญานี้จำนวน <strong>{form.deposit ? `${Number(form.deposit).toLocaleString()} บาท (${toThaiWords(Number(form.deposit))})` : "_______________"}</strong> ซึ่งผู้ขายได้รับไว้เรียบร้อยแล้ว<br />
                    (ข) ชำระส่วนที่เหลือจำนวน <strong>{form.price && form.deposit ? `${(Number(form.price) - Number(form.deposit)).toLocaleString()} บาท` : "_______________"}</strong> ในวันจดทะเบียนโอนกรรมสิทธิ์
                  </p>

                  <p className="font-bold">ข้อ 3. การจดทะเบียนโอนกรรมสิทธิ์</p>
                  <p>
                    คู่สัญญาตกลงไปจดทะเบียนโอนกรรมสิทธิ์ ณ สำนักงานที่ดินที่มีเขตอำนาจ ภายในวันที่ {form.transferDate ? new Date(form.transferDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "_______________"} ทั้งนี้ การซื้อขายอสังหาริมทรัพย์ต้องทำเป็นหนังสือและจดทะเบียนต่อพนักงานเจ้าหน้าที่ มิฉะนั้นเป็นโมฆะ (ป.พ.พ. มาตรา 456)
                  </p>

                  <p className="font-bold">ข้อ 4. ค่าใช้จ่ายในการโอน</p>
                  <p>
                    ค่าธรรมเนียมการโอน ค่าอากรแสตมป์ ภาษีธุรกิจเฉพาะ และภาษีเงินได้หัก ณ ที่จ่าย ตกลงรับผิดชอบดังนี้ ผู้ขายรับผิดชอบ _________________ ผู้ซื้อรับผิดชอบ _________________
                  </p>

                  <p className="font-bold">ข้อ 5. คำรับรองของผู้ขาย</p>
                  <p>
                    ผู้ขายรับรองว่า (1) เป็นเจ้าของกรรมสิทธิ์โดยชอบด้วยกฎหมาย (2) ทรัพย์สินปลอดจากภาระผูกพัน จำนอง ภาระจำยอม หรือสิทธิอื่นใด (3) ไม่มีบุคคลอื่นมีสิทธิเรียกร้องในทรัพย์สิน (4) ไม่มีคดีความหรือข้อพิพาทเกี่ยวกับทรัพย์สิน
                  </p>

                  <p className="font-bold">ข้อ 6. การส่งมอบทรัพย์สิน</p>
                  <p>
                    ผู้ขายจะส่งมอบทรัพย์สินในสภาพเรียบร้อยพร้อมเอกสารสิทธิ์ให้แก่ผู้ซื้อในวันจดทะเบียนโอนกรรมสิทธิ์ ผู้ขายรับผิดชอบค่าสาธารณูปโภคค้างชำระจนถึงวันโอน
                  </p>

                  <p className="font-bold">ข้อ 7. การผิดสัญญาและเงินมัดจำ</p>
                  <p>
                    (ก) หากผู้ซื้อผิดสัญญา ผู้ขายมีสิทธิริบเงินมัดจำทั้งหมด (ป.พ.พ. มาตรา 378)<br />
                    (ข) หากผู้ขายผิดสัญญา ผู้ขายต้องคืนเงินมัดจำ พร้อมชำระเงินอีกจำนวนเท่ากับเงินมัดจำเป็นค่าเสียหาย
                  </p>
                </>
              ) : (
                <>
                  {/* ─── สัญญาเซ้งกิจการ ─── */}
                  <p className="font-bold">ข้อ 1. กิจการที่โอน</p>
                  <p>
                    ผู้โอนเป็นเจ้าของกิจการ คือ <strong>{form.propertyTitle || "_______________"}</strong> ตั้งอยู่ที่ {form.propertyAddress || "_______________"} ผู้โอนตกลงโอนกิจการดังกล่าวพร้อมทั้งสิทธิ ทรัพย์สิน อุปกรณ์ เครื่องมือเครื่องใช้ สินค้าคงคลัง และสิทธิการเช่า (ถ้ามี) ให้แก่ผู้รับโอน
                  </p>

                  <p className="font-bold">ข้อ 2. ค่าตอบแทนการโอนกิจการ</p>
                  <p>
                    ค่าตอบแทนในการโอนกิจการตกลงกันเป็นจำนวน <strong>{form.price ? `${Number(form.price).toLocaleString()} บาท (${toThaiWords(Number(form.price))})` : "_______________"}</strong> โดยผู้รับโอนตกลงชำระดังนี้:
                  </p>
                  <p className="pl-4">
                    (ก) วางเงินมัดจำจำนวน <strong>{form.deposit ? `${Number(form.deposit).toLocaleString()} บาท` : "_______________"}</strong> ในวันทำสัญญา<br />
                    (ข) ชำระส่วนที่เหลือจำนวน <strong>{form.price && form.deposit ? `${(Number(form.price) - Number(form.deposit)).toLocaleString()} บาท` : "_______________"}</strong> ในวันส่งมอบกิจการ
                  </p>

                  <p className="font-bold">ข้อ 3. การส่งมอบกิจการ</p>
                  <p>
                    ผู้โอนจะส่งมอบกิจการภายในวันที่ {form.transferDate ? new Date(form.transferDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "_______________"} พร้อมทั้ง (1) ทรัพย์สินและอุปกรณ์ตามบัญชีแนบท้ายสัญญา (2) สิทธิการเช่าที่เหลืออยู่ (ถ้ามี) (3) ใบอนุญาตประกอบกิจการ (ถ้ามี) (4) รายชื่อลูกค้าและผู้จัดจำหน่าย (ตามที่ตกลง)
                  </p>

                  <p className="font-bold">ข้อ 4. คำรับรองของผู้โอน</p>
                  <p>
                    ผู้โอนรับรองว่า (1) มีสิทธิโอนกิจการได้โดยชอบ (2) กิจการปลอดจากหนี้สินค้างชำระ ยกเว้นที่ระบุในสัญญา (3) ไม่มีคดีความหรือข้อพิพาทที่เกี่ยวข้อง (4) ใบอนุญาตต่างๆ ยังมีผลบังคับใช้
                  </p>

                  <p className="font-bold">ข้อ 5. ข้อตกลงหลังโอน</p>
                  <p>
                    ผู้โอนตกลงจะไม่ประกอบกิจการแข่งขันในรัศมี _________ กิโลเมตร เป็นเวลา _________ ปี นับจากวันส่งมอบ ผู้โอนจะให้ความร่วมมือในการถ่ายทอดความรู้และแนะนำการดำเนินกิจการเป็นเวลา _________ วัน
                  </p>

                  <p className="font-bold">ข้อ 6. การผิดสัญญา</p>
                  <p>
                    (ก) หากผู้รับโอนผิดสัญญา ผู้โอนมีสิทธิริบเงินมัดจำ<br />
                    (ข) หากผู้โอนผิดสัญญา ผู้โอนต้องคืนเงินมัดจำพร้อมชำระค่าเสียหาย
                  </p>
                </>
              )}

              <p className="font-bold">ข้อ {type === "rent" ? "9" : type === "sale" ? "8" : "7"}. กฎหมายที่ใช้บังคับ</p>
              <p>
                สัญญานี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทที่เกิดจากสัญญานี้ให้ระงับโดยศาลที่มีเขตอำนาจ
              </p>

              <p>
                สัญญาฉบับนี้ทำขึ้นสองฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญาโดยตลอดแล้ว เห็นว่าถูกต้องตามเจตนา จึงลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน
              </p>

              <p className="mt-2 text-[10px] text-slate-400 italic">
                หมายเหตุ: สัญญานี้จัดทำเป็นแนวทางเบื้องต้น ควรปรึกษาทนายความหรือผู้เชี่ยวชาญด้านกฎหมายก่อนลงนาม
              </p>

              <div className="mt-10 grid grid-cols-2 gap-8 pt-4">
                <div className="text-center">
                  <div className="mb-8 border-b border-dotted border-slate-300" />
                  <p className="text-xs text-slate-500">({form.sellerName || labels.seller})</p>
                  <p className="text-xs font-semibold text-slate-700">{labels.seller}</p>
                </div>
                <div className="text-center">
                  <div className="mb-8 border-b border-dotted border-slate-300" />
                  <p className="text-xs text-slate-500">({form.buyerName || labels.buyer})</p>
                  <p className="text-xs font-semibold text-slate-700">{labels.buyer}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="mb-8 border-b border-dotted border-slate-300" />
                  <p className="text-xs text-slate-500">(พยาน 1)</p>
                </div>
                <div className="text-center">
                  <div className="mb-8 border-b border-dotted border-slate-300" />
                  <p className="text-xs text-slate-500">(พยาน 2)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
