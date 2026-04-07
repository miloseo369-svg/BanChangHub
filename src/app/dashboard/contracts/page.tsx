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

              <p className="font-bold">ข้อ 1. ทรัพย์สิน</p>
              <p>
                {labels.seller}ตกลง{labels.action}ทรัพย์สิน คือ <strong>{form.propertyTitle || "_______________"}</strong> ตั้งอยู่ที่ {form.propertyAddress || "_______________"} ให้แก่{labels.buyer}
              </p>

              {type === "rent" ? (
                <>
                  <p className="font-bold">ข้อ 2. ค่าเช่าและเงินประกัน</p>
                  <p>
                    {labels.buyer}ตกลงชำระค่าเช่าเดือนละ <strong>{form.rentPerMonth ? `${Number(form.rentPerMonth).toLocaleString()} บาท` : "_______________"}</strong> โดยชำระภายในวันที่ 5 ของทุกเดือน พร้อมวางเงินประกัน <strong>{form.rentDeposit ? `${Number(form.rentDeposit).toLocaleString()} บาท` : "_______________"}</strong>
                  </p>
                  <p className="font-bold">ข้อ 3. ระยะเวลาเช่า</p>
                  <p>
                    สัญญาเช่ามีกำหนด ตั้งแต่ {form.rentStartDate ? new Date(form.rentStartDate).toLocaleDateString("th-TH") : "_______________"} ถึง {form.rentEndDate ? new Date(form.rentEndDate).toLocaleDateString("th-TH") : "_______________"}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">ข้อ 2. ราคาและการชำระเงิน</p>
                  <p>
                    ราคา{labels.action}ตกลงกันที่ <strong>{form.price ? `${Number(form.price).toLocaleString()} บาท` : "_______________"}</strong> โดย{labels.buyer}วางเงินมัดจำ <strong>{form.deposit ? `${Number(form.deposit).toLocaleString()} บาท` : "_______________"}</strong> ในวันทำสัญญา ส่วนที่เหลือชำระในวันโอนกรรมสิทธิ์
                  </p>
                  <p className="font-bold">ข้อ 3. การโอนกรรมสิทธิ์</p>
                  <p>
                    กำหนดโอนกรรมสิทธิ์ภายในวันที่ {form.transferDate ? new Date(form.transferDate).toLocaleDateString("th-TH") : "_______________"}
                  </p>
                </>
              )}

              <p className="font-bold">ข้อ 4. การผิดสัญญา</p>
              <p>
                หากฝ่ายใดผิดสัญญา ฝ่ายที่ผิดสัญญายินยอมชดใช้ค่าเสียหายตามที่ตกลงกัน
              </p>

              <p>
                สัญญาฉบับนี้ทำขึ้นสองฉบับ มีข้อความถูกต้องตรงกัน ทั้งสองฝ่ายได้อ่านและเข้าใจดีแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน
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
