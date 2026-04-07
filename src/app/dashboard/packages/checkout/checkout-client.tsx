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
} from "lucide-react";

const PROMPTPAY_NUMBER = process.env.NEXT_PUBLIC_PROMPTPAY_ID || "";
const IS_PROMPTPAY_SET = !!process.env.NEXT_PUBLIC_PROMPTPAY_ID;

export default function CheckoutClient({
  packageId,
  packageName,
  amount,
  existingPaymentId,
}: {
  packageId: number;
  packageName: string;
  amount: number;
  existingPaymentId: string | null;
}) {
  const [paymentId, setPaymentId] = useState(existingPaymentId);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [step, setStep] = useState<"qr" | "upload" | "waiting">(
    existingPaymentId ? "qr" : "qr"
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Generate QR on mount
  useEffect(() => {
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

  // Create payment record
  useEffect(() => {
    if (paymentId) return;
    async function createPayment() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const ref = `BCH${Date.now().toString(36).toUpperCase()}`;

      const { data, error: insertError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          package_id: packageId,
          amount,
          method: "promptpay",
          promptpay_ref: ref,
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (!insertError && data) {
        setPaymentId(data.id);
      }
    }
    createPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUploadSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !paymentId) return;

    if (!file.type.startsWith("image/")) {
      setError("อัปโหลดได้เฉพาะรูปภาพ");
      return;
    }

    setUploading(true);
    setError("");

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z]/g, "");
    const path = `slips/${paymentId}.${ext}`;

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
      .from("payments")
      .update({ slip_url: publicUrl })
      .eq("id", paymentId);

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
      {step === "qr" && (
        <>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <QrCode size={16} className="text-teal-600" />
            สแกน QR PromptPay เพื่อชำระ
          </h2>

          {!IS_PROMPTPAY_SET && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ยังไม่ได้ตั้งค่า PromptPay — กรุณาติดต่อแอดมิน
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          {/* QR Code */}
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

          {/* Details */}
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
            <div className="flex items-center justify-between">
              <span className="text-slate-500">แพ็กเกจ</span>
              <span className="font-medium text-slate-800">{packageName}</span>
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

      {step === "waiting" && (
        <div className="py-8 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-teal-500" />
          <h2 className="mb-2 text-lg font-bold text-slate-800">อัปโหลดสลิปเรียบร้อย!</h2>
          <p className="mb-1 text-sm text-slate-600">
            รอแอดมินตรวจสอบและยืนยันการชำระเงิน
          </p>
          <p className="mb-6 text-xs text-slate-400">
            โดยปกติใช้เวลาไม่เกิน 1 ชั่วโมงในเวลาทำการ
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/dashboard/packages")}
              className="rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              กลับหน้าแพ็กเกจ
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
