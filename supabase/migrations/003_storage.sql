-- =============================================
-- 003: Supabase Storage for listing images
-- =============================================

-- สร้าง bucket สำหรับรูปภาพ listings
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: ทุกคนดูรูปได้
CREATE POLICY "Listing images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

-- Policy: upload ได้เฉพาะ authenticated + path ขึ้นต้นด้วย listing_id ที่เป็นเจ้าของ
-- ใช้ split_part แทน storage.foldername เพื่อความเข้ากันได้กับทุก Supabase version
CREATE POLICY "Listing images: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listings'
    AND auth.uid() IS NOT NULL
    AND (
      -- path = {listing_id}/{filename} — เช็คว่า folder แรกเป็น listing ของ user
      EXISTS (
        SELECT 1 FROM public.listings
        WHERE id::text = split_part(name, '/', 1)
          AND user_id = auth.uid()
      )
      -- หรือเป็น path slips/ (สำหรับอัปโหลดสลิป)
      OR name LIKE 'slips/%'
    )
  );

-- Policy: ลบได้เฉพาะเจ้าของ listing
CREATE POLICY "Listing images: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listings'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.listings
        WHERE id::text = split_part(name, '/', 1)
          AND user_id = auth.uid()
      )
      OR name LIKE 'slips/%'
    )
  );
