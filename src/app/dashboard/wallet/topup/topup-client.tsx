"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { generatePromptPayPayload } from "@/lib/promptpay";
import QRCode from "qrcode";
import {
  QrCode,
  Upload,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  ImagePlus,
  Wallet,
} from "lucide-react";

const PROMPTPAY_NUMBER = process.env.NEXT_PUBLIC_PROMPTPAY_ID || "";
const IS_PROMPTPAY_SET = !!process.env.NEXT_PUBLIC_PROMPTPAY_ID;

const PRESET_AMOUNTS = [100, 300, 500, 1000, 2000, 5000];

export default function TopupClient({
  existingTopupId,
  existingAmount,
}: {
  existingTopupId: string | null;
  existingAmount: number | null;
}) {
  const [topupId, setTopupId] = useState(existingTopupId);
  const [amount, setAmount] = useState(existingAmount ?? 0);
  const [customAmount, setCustomAmount] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [step, setStep] = useState<"amount" | "qr" | "upload" | "waiting">(
    existingTopupId ? "qr" : "amount"
  );
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Generate QR when amount is set
  useEffect(() => {
    if (amount <= 0) return;
    const payload = generatePromptPayPayload({
      phoneOrTaxId: PROMPTPAY_NUMBER,
      amount,
    });
    QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: { dark: "#1e3a5f", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [amount]);

  async function handleSelectAmount(selectedAmount: number) {
    if (creating) return; // ป้องกัน double-click
    setCreating(true);
    setAmount(selectedAmount);
    setError("");

    // Create topup request
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    const ref = `CRD${Date.now().toString(36).toUpperCase()}`;

    const { data, error: insertError } = await supabase
      .from("topup_requests")
      .insert({
        user_id: user.id,
        amount: selectedAmount,
        method: "promptpay",
        promptpay_ref: ref,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      setError("สร้างรายการไม่สำเร็จ: " + insertError.message);
      setCreating(false);
      return;
    }

    if (data) {
      setTopupId(data.id);
      setStep("qr");
    }
    setCreating(false);
  }

  function handleCustomSubmit() {
    const val = Number(customAmount);
    if (!val || val < 10) {
      setError("จำนวนเงินขั้นต่ำ 10 บาท");
      return;
    }
    if (val > 100000) {
      setError("จำนวนเงินสูงสุด 100,000 บาท");
      return;
    }
    handleSelectAmount(val);
  }

  async function handleUploadSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !topupId) return;

    if (!file.type.startsWith("image/")) {
      setError("อัปโหลดได้เฉพาะรูปภาพ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกิน 5MB กรุณาเลือกรูปใหม่");
      return;
    }

    setUploading(true);
    setError("");

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z]/g, "");
    const path = `slips/topup_${topupId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listings")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("อัปโหลดไม่สำเร็จ: " + uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("listings").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("topup_requests")
      .update({ slip_url: publicUrl })
      .eq("id", topupId);

    if (updateError) {
      setError("บันทึกไม่สำเร็จ: " + updateError.message);
    } else {
      setStep("waiting");
    }

    setUploading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(PROMPTPAY_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Step 1: Select Amount */}
      {step === "amount" && (
        <>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Wallet size={16} className="text-teal-600" />
            เลือกจำนวนเครดิตที่ต้องการเติม
          </h2>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          <p className="mb-3 text-xs text-slate-500">1 เครดิต = 1 บาท</p>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleSelectAmount(preset)}
                disabled={creating}
                className="rounded-lg border-2 border-slate-200 py-3 text-center font-bold text-slate-800 transition-colors hover:border-teal-500 hover:bg-teal-50 disabled:opacity-50"
              >
                ฿{preset.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-slate-500">หรือกำหนดจำนวนเอง</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="จำนวนเงิน (บาท)"
                min="10"
                max="100000"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={creating}
                className="shrink-0 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                เติมเงิน
              </button>
            </div>
          </div>
        </>
      )}

      {/* Step 2: QR Code */}
      {step === "qr" && (
        <>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <QrCode size={16} className="text-teal-600" />
            สแกน QR PromptPay เพื่อเติมเครดิต
          </h2>

          {!IS_PROMPTPAY_SET && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ยังไม่ได้ตั้งค่า PromptPay — กรุณาติดต่อแอดมิน
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          <div className="mb-4 flex justify-center">
            <div className="rounded-xl border-2 border-teal-100 bg-white p-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="PromptPay QR" className="h-56 w-56" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-slate-300" />
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">PromptPay</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-slate-800">{PROMPTPAY_NUMBER}</span>
                <button onClick={handleCopy} className="text-teal-600 hover:text-teal-700" title="คัดลอก">
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">จำนวนเงิน</span>
              <span className="text-lg font-extrabold text-teal-600">฿{amount.toLocaleString()}</span>
            </div>
          </div>

          <p className="mb-4 text-center text-xs text-slate-400">
            ชำระเงินแล้ว อัปโหลดสลิปเพื่อยืนยัน
          </p>

          <button
            onClick={() => setStep("upload")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Upload size={16} />
            ชำระแล้ว อัปโหลดสลิป
          </button>
        </>
      )}

      {/* Step 3: Upload Slip */}
      {step === "upload" && (
        <>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Upload size={16} className="text-teal-600" />
            อัปโหลดสลิปการโอน
          </h2>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          <div
            onClick={() => fileRef.current?.click()}
            className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-slate-400 transition-colors hover:border-teal-400 hover:text-teal-500"
          >
            {uploading ? (
              <Loader2 size={32} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={32} className="mb-2" />
                <p className="text-sm font-medium">กดเพื่อเลือกรูปสลิป</p>
                <p className="text-[11px]">JPG, PNG ขนาดไม่เกิน 5MB</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUploadSlip}
            className="hidden"
          />

          <button
            onClick={() => setStep("qr")}
            className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            กลับไปดู QR
          </button>
        </>
      )}

      {/* Step 4: Waiting */}
      {step === "waiting" && (
        <div className="py-8 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-teal-500" />
          <h2 className="mb-2 text-lg font-bold text-slate-800">อัปโหลดสลิปเรียบร้อย!</h2>
          <p className="mb-1 text-sm text-slate-600">
            รอแอดมินตรวจสอบและยืนยันการเติมเครดิต
          </p>
          <p className="mb-2 text-sm font-semibold text-teal-600">
            จำนวน ฿{amount.toLocaleString()}
          </p>
          <p className="mb-6 text-xs text-slate-400">
            โดยปกติใช้เวลาไม่เกิน 1 ชั่วโมงในเวลาทำการ
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/dashboard/wallet")}
              className="rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              กลับกระเป๋าเครดิต
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              กลับ Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
