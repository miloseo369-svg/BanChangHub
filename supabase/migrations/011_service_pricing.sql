-- =============================================
-- 011: Service Pricing (admin-editable)
-- =============================================

CREATE TABLE public.service_pricing (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  start_price DECIMAL(10,2) NOT NULL,
  price_unit TEXT NOT NULL DEFAULT 'บาท/ตร.ม.',
  features TEXT[] DEFAULT '{}',
  accent_color TEXT DEFAULT 'from-teal-500 to-emerald-500',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO public.service_pricing (slug, title, description, start_price, price_unit, features, accent_color, sort_order) VALUES
  ('build-new', 'สร้างบ้านใหม่', 'ออกแบบและสร้างบ้านในฝัน ควบคุมทุกขั้นตอนโดยวิศวกร', 8500, 'บาท/ตร.ม.', '{"ออกแบบฟรี","ควบคุมโดยวิศวกร","รับประกัน 5 ปี"}', 'from-teal-500 to-emerald-500', 1),
  ('renovate', 'รีโนเวทบ้าน', 'ปรับปรุงบ้านเก่าให้เป็นบ้านใหม่ งานไฟ ประปา โครงสร้าง ครบวงจร', 3500, 'บาท/ตร.ม.', '{"ประเมินราคาฟรี","ไม่มีค่าใช้จ่ายซ่อน","ดูแลหลังงาน"}', 'from-sky-500 to-blue-500', 2),
  ('extend', 'ต่อเติม-ปรับปรุง', 'ต่อเติมห้อง ครัว หลังคา ระเบียง เพิ่มพื้นที่ใช้สอย', 5000, 'บาท/ตร.ม.', '{"ตรวจโครงสร้างฟรี","ใบอนุญาตถูกต้อง","วัสดุคุณภาพ"}', 'from-amber-500 to-orange-500', 3),
  ('knockdown', 'บ้านน็อคดาวน์', 'บ้านสำเร็จรูป สร้างไว ราคาประหยัด พร้อมอยู่ภายใน 45 วัน', 4500, 'บาท/ตร.ม.', '{"สร้างเสร็จ 45 วัน","ราคาเหมาจ่าย","ย้ายได้ ทนทาน"}', 'from-violet-500 to-purple-500', 4),
  ('pet-house', 'บ้านน้องหมา-น้องแมว', 'ออกแบบและสร้างบ้านสัตว์เลี้ยง คอกสุนัข กรงแมว สั่งทำตามขนาด', 2500, 'บาท/หลัง', '{"สั่งทำตามขนาด","วัสดุปลอดภัย","กันฝน-แดด"}', 'from-rose-500 to-pink-500', 5);

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

-- ทุกคนดูได้
CREATE POLICY "Service pricing: public read"
  ON public.service_pricing FOR SELECT USING (true);

-- Admin แก้ได้
CREATE POLICY "Service pricing: admin full access"
  ON public.service_pricing FOR ALL USING (public.is_admin());

CREATE TRIGGER update_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
