"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Star, Loader2 } from "lucide-react";

export default function ImageUpload({
  listingId,
  existingImages,
}: {
  listingId: string;
  existingImages: { id: string; url: string; is_cover: boolean; sort_order: number }[];
}) {
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    const newImages: typeof images = [];

    const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate type
      if (!file.type.startsWith("image/")) {
        setError("อัปโหลดได้เฉพาะไฟล์รูปภาพ");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        continue;
      }

      // Safe filename — ป้องกัน path traversal
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z]/g, "");
      if (!ALLOWED_EXT.includes(ext)) {
        setError("รองรับเฉพาะ JPG, PNG, WebP, GIF");
        continue;
      }
      const safeName = `${Date.now()}-${i}.${ext}`;
      const path = `${listingId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(path, file);

      if (uploadError) {
        setError("อัปโหลดไม่สำเร็จ: " + uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("listings").getPublicUrl(path);

      // Save to listing_images table
      const { data: imgData, error: insertError } = await supabase
        .from("listing_images")
        .insert({
          listing_id: listingId,
          url: publicUrl,
          sort_order: images.length + i,
          is_cover: images.length === 0 && i === 0,
        })
        .select("id, url, is_cover, sort_order")
        .single();

      if (insertError) {
        // Rollback: ลบไฟล์ที่อัปแล้วถ้า DB insert ล้มเหลว
        await supabase.storage.from("listings").remove([path]);
        setError("บันทึกข้อมูลรูปไม่สำเร็จ: " + insertError.message);
        continue;
      }

      if (imgData) {
        newImages.push(imgData);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function handleDelete(imageId: string, url: string) {
    // ลบ storage ก่อน แล้วค่อยลบ DB
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/listings\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("listings").remove([pathMatch[1]]);
      }
    } catch {
      // URL parse failed — ลบจาก DB อย่างเดียว
    }

    const { error: deleteError } = await supabase
      .from("listing_images")
      .delete()
      .eq("id", imageId);

    if (!deleteError) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    }
  }

  async function handleSetCover(imageId: string) {
    // Unset all covers
    const { error: unsetError } = await supabase
      .from("listing_images")
      .update({ is_cover: false })
      .eq("listing_id", listingId);

    if (unsetError) return;

    // Set new cover
    const { error: setError } = await supabase
      .from("listing_images")
      .update({ is_cover: true })
      .eq("id", imageId);

    if (!setError) {
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_cover: img.id === imageId }))
      );
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-slate-800">
        รูปภาพ ({images.length})
      </h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${
              img.is_cover ? "border-teal-500" : "border-transparent"
            }`}
          >
            <img
              src={img.url}
              alt=""
              className="h-full w-full object-cover"
            />
            {img.is_cover && (
              <span className="absolute left-1 top-1 rounded bg-teal-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                ปก
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {!img.is_cover && (
                <button
                  onClick={() => handleSetCover(img.id)}
                  className="rounded-full bg-white p-1.5 text-slate-700 hover:bg-teal-50"
                  title="ตั้งเป็นภาพปก"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                onClick={() => handleDelete(img.id, img.url)}
                className="rounded-full bg-white p-1.5 text-red-500 hover:bg-red-50"
                title="ลบรูป"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-teal-400 hover:text-teal-500 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <div className="text-center">
              <ImagePlus size={20} className="mx-auto mb-1" />
              <span className="text-[10px]">เพิ่มรูป</span>
            </div>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <p className="mt-2 text-[10px] text-slate-400">
        รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5MB ต่อรูป
      </p>
    </div>
  );
}
