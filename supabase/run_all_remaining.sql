-- =============================================
-- 002: Subscriptions & Appointments
-- =============================================

-- 12. SUBSCRIPTIONS (สมาชิกแพ็กเกจ)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id INT NOT NULL REFERENCES public.packages(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_ref TEXT, -- อ้างอิงการชำระเงิน
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. APPOINTMENTS (นัดหมาย)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- ผู้ขอนัด
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,     -- เจ้าของประกาศ/เอเจนท์
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  location TEXT, -- สถานที่นัดพบ
  message TEXT,  -- ข้อความจากผู้ขอนัด
  agent_note TEXT, -- โน้ตจากเอเจนท์
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  cancelled_by UUID REFERENCES public.profiles(id),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ป้องกันนัดซ้ำ: requester เดิม + listing เดิม + วัน/เวลาเดิม (เฉพาะที่ยังไม่ยกเลิก)
CREATE UNIQUE INDEX idx_appointments_no_duplicate
  ON public.appointments(requester_id, listing_id, scheduled_date, scheduled_time)
  WHERE status IN ('pending', 'confirmed');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status) WHERE status = 'active';

-- Index สำหรับ boosted listings (ใช้แสดงบน homepage)
CREATE INDEX idx_listings_boosted ON public.listings(is_boosted, boost_expires_at DESC)
  WHERE is_boosted = TRUE;
CREATE INDEX idx_appointments_requester_id ON public.appointments(requester_id);
CREATE INDEX idx_appointments_agent_id ON public.appointments(agent_id);
CREATE INDEX idx_appointments_listing_id ON public.appointments(listing_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_date, scheduled_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: ดูได้เฉพาะตัวเอง
CREATE POLICY "Subscriptions: viewable by owner"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions: updatable by owner"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Appointments: ผู้ขอนัดและเอเจนท์เห็น
CREATE POLICY "Appointments: viewable by requester or agent"
  ON public.appointments FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = agent_id);

-- Appointments: สร้างได้เฉพาะ authenticated
CREATE POLICY "Appointments: insertable by authenticated"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Appointments: อัปเดตได้ทั้ง requester และ agent
CREATE POLICY "Appointments: updatable by requester or agent"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = agent_id);

-- Appointments: ลบได้ทั้ง requester และ agent
CREATE POLICY "Appointments: deletable by requester or agent"
  ON public.appointments FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = agent_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- เช็คว่า user มีแพ็กเกจ active อยู่ไหม (ไม่นับแพ็กเกจฟรี)
-- จำกัดให้เช็คได้เฉพาะตัวเอง เพื่อป้องกัน information leak
CREATE OR REPLACE FUNCTION public.has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- ต้องเช็คเฉพาะ user ตัวเอง
  IF check_user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.packages p ON p.id = s.package_id
    WHERE s.user_id = check_user_id
      AND s.status = 'active'
      AND s.expires_at > NOW()
      AND p.price > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ลบบัญชีผู้ใช้ (เรียกจาก client — ลบ auth.users จะ cascade ลบ profiles + ข้อมูลทั้งหมด)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
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
-- =============================================
-- 004: Admin RLS Policies
-- =============================================

-- Function: เช็คว่า user เป็น admin หรือไม่
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: จัดการ listings ทุกสถานะ
CREATE POLICY "Listings: admin full access"
  ON public.listings FOR ALL
  USING (public.is_admin());

-- Admin: จัดการ profiles
CREATE POLICY "Profiles: admin full access"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- Admin: จัดการ banners
CREATE POLICY "Banners: admin full access"
  ON public.banners FOR ALL
  USING (public.is_admin());

-- Admin: จัดการ articles
CREATE POLICY "Articles: admin full access"
  ON public.articles FOR ALL
  USING (public.is_admin());

-- Admin: ดู subscriptions ทั้งหมด
CREATE POLICY "Subscriptions: admin viewable"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

-- Admin: ดู appointments ทั้งหมด
CREATE POLICY "Appointments: admin viewable"
  ON public.appointments FOR SELECT
  USING (public.is_admin());

-- Admin: ดู inquiries ทั้งหมด
CREATE POLICY "Inquiries: admin viewable"
  ON public.inquiries FOR SELECT
  USING (public.is_admin());
-- =============================================
-- 005: Payments
-- =============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id INT NOT NULL REFERENCES public.packages(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'promptpay' CHECK (method IN ('promptpay', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),
  promptpay_ref TEXT, -- เลข ref ที่แสดงบน QR
  slip_url TEXT, -- URL สลิปที่อัปโหลด
  admin_note TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL, -- หมดเวลาชำระ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- User เห็นเฉพาะของตัวเอง
CREATE POLICY "Payments: viewable by owner"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Payments: insertable by owner"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Payments: updatable by owner (upload slip)"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin เห็นทั้งหมด + จัดการได้
CREATE POLICY "Payments: admin full access"
  ON public.payments FOR ALL
  USING (public.is_admin());

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: admin ยืนยันชำระ → สร้าง subscription อัตโนมัติ
CREATE OR REPLACE FUNCTION public.confirm_payment(payment_id UUID)
RETURNS VOID AS $$
DECLARE
  p RECORD;
  pkg RECORD;
BEGIN
  -- ต้องเป็น admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- FOR UPDATE ป้องกัน race condition (double confirm)
  SELECT * INTO p FROM public.payments WHERE id = payment_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;

  SELECT * INTO pkg FROM public.packages WHERE id = p.package_id;

  -- อัปเดต payment
  UPDATE public.payments SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = auth.uid()
  WHERE id = payment_id;

  -- สร้าง subscription
  INSERT INTO public.subscriptions (user_id, package_id, starts_at, expires_at)
  VALUES (
    p.user_id,
    p.package_id,
    NOW(),
    NOW() + (pkg.duration_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================
-- 006: Notifications
-- =============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'inquiry', 'listing_approved', 'listing_rejected', 'payment_confirmed', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL ที่คลิกไปได้
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: viewable by owner"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications: updatable by owner"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications: insertable by system"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- ใช้ trigger/function สร้าง

CREATE POLICY "Notifications: admin full access"
  ON public.notifications FOR ALL
  USING (public.is_admin());

-- Trigger: สร้าง notification เมื่อมีนัดหมายใหม่
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.agent_id,
    'appointment',
    'มีนัดหมายใหม่',
    'มีคนนัดดูทรัพย์สินของคุณ วันที่ ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY'),
    '/dashboard/appointments'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();

-- Trigger: แจ้งเตือนเมื่อมี inquiry ใหม่
CREATE OR REPLACE FUNCTION notify_new_inquiry()
RETURNS TRIGGER AS $$
DECLARE
  listing_owner UUID;
BEGIN
  SELECT user_id INTO listing_owner FROM public.listings WHERE id = NEW.listing_id;
  IF listing_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      listing_owner,
      'inquiry',
      'มีข้อความใหม่',
      COALESCE(NEW.sender_name, 'ผู้สนใจ') || ' สอบถามเกี่ยวกับประกาศของคุณ',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_inquiry
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_inquiry();
-- =============================================
-- 007: Listing slug for SEO-friendly URLs
-- =============================================

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);

-- Auto-generate slug from title on insert
CREATE OR REPLACE FUNCTION generate_listing_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Convert title to slug: lowercase, replace spaces with dashes, keep thai chars
  base_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.title), '[^a-z0-9ก-๙]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := LEFT(base_slug, 80);

  -- Append listing_code for uniqueness
  IF NEW.listing_code IS NOT NULL THEN
    base_slug := base_slug || '-' || LOWER(NEW.listing_code);
  END IF;

  final_slug := base_slug;

  -- Handle duplicates
  WHILE EXISTS (SELECT 1 FROM public.listings WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listing_slug
  BEFORE INSERT OR UPDATE OF title ON public.listings
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_listing_slug();
-- =============================================
-- 008: Seed Admin Account
-- =============================================
-- วิธีใช้: หลัง deploy แล้ว สมัครสมาชิกด้วยอีเมล admin ก่อน
-- แล้ว run SQL นี้ใน Supabase SQL Editor เพื่อ promote เป็น admin
--
-- เปลี่ยนอีเมลด้านล่างเป็นอีเมลจริงของ admin

-- ตัวอย่าง: promote user เป็น admin ด้วยอีเมล
-- UPDATE public.profiles
-- SET role = 'admin', is_verified = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@banchanghub.com');

-- Function: ใช้ promote admin จาก Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = user_email;

  IF target_id IS NULL THEN
    RETURN 'ไม่พบ user ด้วยอีเมล: ' || user_email;
  END IF;

  UPDATE public.profiles
  SET role = 'admin', is_verified = true
  WHERE id = target_id;

  RETURN 'สำเร็จ: ' || user_email || ' เป็น admin แล้ว';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================
-- 009: Extra listing fields (furnishing, direction, amenities, nearby, year)
-- =============================================

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS furnishing TEXT CHECK (furnishing IN ('none', 'partial', 'full'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS facing TEXT CHECK (facing IN ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS nearby TEXT[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS year_built INT;
-- =============================================
-- 010: Extra service categories
-- =============================================

INSERT INTO public.categories (name, slug, type, sort_order) VALUES
  ('บ้านน็อคดาวน์', 'knockdown', 'service', 5),
  ('บ้านสัตว์เลี้ยง', 'pet-house', 'service', 6)
ON CONFLICT (slug) DO NOTHING;
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
-- =============================================
-- 012: Seed 20 SEO Articles
-- =============================================
-- Admin สามารถแก้ไข/เพิ่มรูปได้ที่หลังผ่าน admin panel

INSERT INTO public.articles (author_id, title, slug, excerpt, content, cover_image, category, tags, status, published_at, view_count) VALUES

-- ─── กลุ่ม 1: ซื้อบ้านอีสาน ───

(NULL,
'5 สิ่งที่ต้องเช็คก่อนซื้อบ้านจัดสรรในอีสาน',
'5-things-check-before-buying-house-isan',
'เช็คลิสต์สำคัญก่อนตัดสินใจซื้อบ้านจัดสรรในภาคอีสาน ป้องกันปัญหาภายหลัง',
'การซื้อบ้านจัดสรรเป็นการลงทุนครั้งใหญ่ โดยเฉพาะในภาคอีสานที่ตลาดอสังหาฯ กำลังเติบโต ก่อนตัดสินใจซื้อ ควรเช็ค 5 สิ่งนี้:

1. ตรวจสอบใบอนุญาตจัดสรรที่ดิน
ขอดูใบอนุญาตจัดสรรจากกรมที่ดิน ตรวจสอบว่าโครงการได้รับอนุญาตถูกต้อง มีการวางผังชุมชนตามกฎหมาย

2. เช็คโครงสร้างและวัสดุก่อสร้าง
ดูสเปคบ้านให้ละเอียด — เสาเข็ม พื้น ผนัง หลังคา ใช้วัสดุอะไร มีวิศวกรควบคุมงานหรือไม่ ขอดูรายงานการตรวจสอบโครงสร้าง

3. สาธารณูปโภคครบไหม
ถนนในหมู่บ้านเป็นคอนกรีตหรือลาดยาง มีระบบระบายน้ำ ไฟส่องสว่าง ระบบรักษาความปลอดภัย

4. ทำเลและการเดินทาง
ใกล้ถนนใหญ่แค่ไหน ระยะทางไปตลาด โรงเรียน โรงพยาบาล ห้างสรรพสินค้า ตรวจสอบแผนผังเมืองว่าบริเวณรอบข้างจะมีการพัฒนาอะไรบ้าง

5. เปรียบเทียบราคากับโครงการอื่น
อย่าซื้อโครงการแรกที่เห็น เปรียบเทียบราคาต่อตารางเมตร สเปคบ้าน และสิ่งอำนวยความสะดวกกับโครงการอื่นในย่านเดียวกัน

BanChangHub ช่วยคุณเปรียบเทียบโครงการบ้านจัดสรรทั่วอีสานตอนบน ทุกโครงการผ่านการตรวจสอบมาตรฐาน Certified',
NULL, 'buy', ARRAY['ซื้อบ้าน','อีสาน','บ้านจัดสรร','เช็คลิสต์'], 'published', NOW() - INTERVAL '20 days', 324),

(NULL,
'บ้านอุดรธานี 2569 — ทำเลไหนน่าซื้อที่สุด',
'best-location-udon-thani-2569',
'วิเคราะห์ทำเลทองซื้อบ้านในอุดรธานี ปี 2569 พร้อมราคาตลาดเปรียบเทียบ',
'อุดรธานีเป็นเมืองเศรษฐกิจอันดับ 1 ของอีสานตอนบน ตลาดอสังหาฯ เติบโตต่อเนื่อง ทำเลที่น่าสนใจในปี 2569 ได้แก่:

ย่านหมากแข้ง-เมือง
ใจกลางเมือง ใกล้ห้าง UD Town, Central Plaza ราคาบ้านเดี่ยว 3-5 ล้านบาท เหมาะกับคนทำงานในเมือง

ย่านหนองบัว-บ้านจั่น
ทำเลใหม่กำลังมาแรง ใกล้มหาวิทยาลัยราชภัฏ ราคาบ้าน 2-3.5 ล้านบาท คุ้มค่าเงิน มีโครงการใหม่เยอะ

ย่านนาดี-หนองไผ่
ถนนมิตรภาพ ทำเลติดถนนใหญ่ เหมาะกับคนที่เดินทางบ่อย ราคาที่ดินยังไม่แพง มีศักยภาพเพิ่มมูลค่า

ย่านบ้านดุง
อำเภอบ้านดุง เมืองรอง ราคาบ้าน 1.5-2.5 ล้านบาท เหมาะกับครอบครัวที่ต้องการบ้านราคาประหยัด

ค้นหาบ้านในอุดรธานีทุกย่าน ทุกราคา ได้ที่ BanChangHub — ฟรี ไม่มีค่าใช้จ่าย',
NULL, 'buy', ARRAY['อุดรธานี','ทำเล','ซื้อบ้าน','ราคาบ้าน'], 'published', NOW() - INTERVAL '18 days', 512),

(NULL,
'ซื้อบ้านหนองคาย ริมโขง — ข้อดีและข้อควรระวัง',
'buying-house-nong-khai-mekong',
'บ้านริมโขงหนองคาย ราคาดี วิวสวย แต่มีอะไรต้องระวังบ้าง อ่านก่อนซื้อ',
'หนองคายเป็นเมืองริมแม่น้ำโขงที่มีเสน่ห์ ติดชายแดนลาว มีสะพานมิตรภาพไทย-ลาว การซื้อบ้านริมโขงมีทั้งข้อดีและข้อควรระวัง:

ข้อดี:
• วิวแม่น้ำโขงสวยงาม อากาศดี ไม่วุ่นวาย
• ราคาบ้านและที่ดินถูกกว่าอุดรธานี 20-30%
• ใกล้ด่านหนองคาย ค้าขายกับลาวสะดวก
• แหล่งท่องเที่ยวเยอะ เช่น วัดผาตากเสื้อ ศาลาแก้วกู่

ข้อควรระวัง:
• พื้นที่ริมโขงบางจุดอาจถูกน้ำท่วมในฤดูน้ำหลาก ต้องเช็คประวัติน้ำท่วม
• บางพื้นที่อยู่ในเขตอนุรักษ์ ห้ามก่อสร้าง
• ระยะทางไปอุดรธานี 50 กม. ต้องพิจารณาเรื่องการเดินทาง

หาบ้านริมโขงหนองคาย ตรวจสอบทำเลและราคาตลาดได้ที่ BanChangHub',
NULL, 'buy', ARRAY['หนองคาย','ริมโขง','ซื้อบ้าน'], 'published', NOW() - INTERVAL '16 days', 487),

-- ─── กลุ่ม 2: สร้างบ้าน/รีโนเวท ───

(NULL,
'รีโนเวทบ้านเก่า งบ 5 แสน ทำอะไรได้บ้าง',
'renovate-old-house-500k-budget',
'งบ 500,000 บาท รีโนเวทบ้านเก่าทำอะไรได้บ้าง พร้อมตัวอย่างจริง',
'งบ 500,000 บาท สามารถรีโนเวทบ้านเก่าได้หลายอย่าง ขึ้นอยู่กับสิ่งที่ต้องการปรับปรุง:

งบ 100,000-150,000 บาท — ปรับปรุงเบื้องต้น
• ทาสีใหม่ทั้งหลัง
• เปลี่ยนกระเบื้องพื้น
• ซ่อมระบบไฟฟ้าเก่า
• เปลี่ยนสุขภัณฑ์ห้องน้ำ

งบ 200,000-300,000 บาท — ปรับปรุงปานกลาง
• ทุบห้องน้ำทำใหม่
• เปลี่ยนหน้าต่างอลูมิเนียม
• ทำครัวใหม่พร้อมเคาน์เตอร์
• ติดฝ้าเพดานใหม่

งบ 400,000-500,000 บาท — รีโนเวทเต็มรูปแบบ
• ต่อเติมห้อง 1 ห้อง (ประมาณ 12 ตร.ม.)
• เปลี่ยนหลังคาใหม่
• ทำระบบประปา-ไฟฟ้าใหม่ทั้งหมด
• ตกแต่งภายในสไตล์โมเดิร์น

BanChangHub มีบริการรีโนเวทบ้าน เริ่มต้น 3,500 บาท/ตร.ม. ประเมินราคาฟรี ควบคุมงานโดยวิศวกร',
NULL, 'renovate', ARRAY['รีโนเวท','งบประมาณ','บ้านเก่า'], 'published', NOW() - INTERVAL '15 days', 698),

(NULL,
'เปรียบเทียบ สร้างบ้านเอง vs ซื้อบ้านจัดสรร ในอีสาน',
'build-vs-buy-house-isan',
'สร้างบ้านเองหรือซื้อจัดสรรดี เปรียบเทียบข้อดี-ข้อเสีย ราคา คุณภาพ ในอีสาน',
'คำถามยอดฮิตของคนอีสาน — สร้างบ้านเองหรือซื้อจัดสรรดีกว่ากัน มาเปรียบเทียบ:

สร้างบ้านเอง
ข้อดี:
• ออกแบบได้ตามใจ เลือกวัสดุเอง
• ราคาถูกกว่า 10-20% (ถ้าคุมงานได้)
• ได้บ้านในที่ดินตัวเอง

ข้อเสีย:
• ใช้เวลานาน 6-12 เดือน
• ต้องหาที่ดิน + ขออนุญาตก่อสร้างเอง
• เสี่ยงเจอช่างไม่ดี งานล่าช้า งบบานปลาย

ซื้อบ้านจัดสรร
ข้อดี:
• พร้อมอยู่ ไม่ต้องรอ
• สาธารณูปโภคครบ ถนน น้ำ ไฟ
• กู้ธนาคารง่าย มีโฉนดชัดเจน

ข้อเสีย:
• ออกแบบไม่ได้ ต้องรับสเปคที่มี
• ราคาแพงกว่า (รวมกำไรโครงการ)
• พื้นที่ดินน้อยกว่าสร้างเอง

BanChangHub มีทั้งบริการสร้างบ้านใหม่ เริ่ม 8,500 บาท/ตร.ม. และโครงการบ้านจัดสรร Certified ให้เลือก',
NULL, 'build', ARRAY['สร้างบ้าน','บ้านจัดสรร','เปรียบเทียบ','อีสาน'], 'published', NOW() - INTERVAL '14 days', 543),

(NULL,
'บ้านน็อคดาวน์ คืออะไร เหมาะกับใคร ราคาเท่าไหร่',
'knockdown-house-guide-price',
'ทำความรู้จักบ้านน็อคดาวน์ ข้อดี-ข้อเสีย ราคาตลาด และเหมาะกับใครบ้าง',
'บ้านน็อคดาวน์ (Knockdown House) คือบ้านสำเร็จรูปที่ผลิตชิ้นส่วนจากโรงงาน แล้วมาประกอบที่หน้างาน สร้างเสร็จเร็วภายใน 30-60 วัน

ข้อดี:
• สร้างเร็ว พร้อมอยู่ภายใน 45 วัน
• ราคาแน่นอน ไม่บวมเพิ่ม
• ย้ายที่ตั้งได้ (บางรุ่น)
• คุณภาพสม่ำเสมอ ผลิตจากโรงงาน

ข้อเสีย:
• แบบบ้านจำกัด เลือกได้ตามที่มี
• ดัดแปลงยากกว่าบ้านปูน
• อายุการใช้งานสั้นกว่าบ้านปูน (20-30 ปี)

ราคาตลาด:
• บ้านน็อคดาวน์เล็ก (24-36 ตร.ม.) — 150,000-250,000 บาท
• บ้านน็อคดาวน์กลาง (48-72 ตร.ม.) — 350,000-600,000 บาท
• บ้านน็อคดาวน์ใหญ่ (80-120 ตร.ม.) — 700,000-1,200,000 บาท

BanChangHub รับสร้างบ้านน็อคดาวน์ เริ่มต้น 4,500 บาท/ตร.ม. สร้างเสร็จ 45 วัน',
NULL, 'build', ARRAY['บ้านน็อคดาวน์','ราคา','สร้างบ้าน'], 'published', NOW() - INTERVAL '13 days', 421),

-- ─── กลุ่ม 3: เซ้งกิจการ ───

(NULL,
'เซ้งร้านกาแฟในอีสาน — ต้องเตรียมอะไรบ้าง',
'transfer-coffee-shop-isan-guide',
'คู่มือเซ้งร้านกาแฟในอีสาน เตรียมเอกสาร ตรวจสอบอะไรบ้าง พร้อมเช็คลิสต์',
'ธุรกิจร้านกาแฟในอีสานเติบโตเร็ว หลายคนเลือกเซ้งร้านที่มีอยู่แล้วแทนการเริ่มใหม่ นี่คือสิ่งที่ต้องเตรียม:

ก่อนเซ้ง — ตรวจสอบ:
• สัญญาเช่าเหลือกี่ปี ต่อได้ไหม ค่าเช่าเดือนละเท่าไหร่
• ยอดขายเฉลี่ยต่อวัน/เดือน ขอดูบัญชีรายรับ-รายจ่าย
• อุปกรณ์สภาพดีไหม เครื่องชงกาแฟยี่ห้ออะไร อายุเท่าไหร่
• ใบอนุญาตประกอบกิจการยังมีผลอยู่ไหม
• ทำไมเจ้าของเดิมถึงเซ้ง

เอกสารที่ต้องเตรียม:
• บัตรประชาชน + ทะเบียนบ้าน
• สัญญาเซ้งกิจการ (BanChangHub สร้างให้ฟรี)
• บัญชีรายการทรัพย์สินที่รวมในการเซ้ง
• สัญญาเช่าพื้นที่ (โอนสิทธิ)

ค่าเซ้งร้านกาแฟในอีสาน:
• ร้านเล็ก (คีออส/หน้าร้าน) — 50,000-150,000 บาท
• ร้านกลาง (20-40 ตร.ม.) — 200,000-500,000 บาท
• ร้านใหญ่ (มีที่นั่ง) — 500,000-1,500,000 บาท

ค้นหาร้านกาแฟให้เซ้งทั่วอีสาน ได้ที่ BanChangHub',
NULL, 'tips', ARRAY['เซ้ง','ร้านกาแฟ','กิจการ','อีสาน'], 'published', NOW() - INTERVAL '12 days', 356),

(NULL,
'เซ้งร้านอาหาร หนองคาย — ทำเลไหนขายดี',
'best-location-restaurant-nong-khai',
'วิเคราะห์ทำเลเปิดร้านอาหารในหนองคาย ย่านไหนนักท่องเที่ยวเยอะ ขายดี',
'หนองคายเป็นเมืองท่องเที่ยวริมโขง นักท่องเที่ยวทั้งไทยและต่างชาติมาเยือนตลอดปี ทำเลเปิดร้านอาหารที่ดีที่สุด:

ย่านท่าเสด็จ — ริมโขง
ถนนคนเดิน ตลาดอินโดจีน นักท่องเที่ยวเดินผ่านตลอด ค่าเช่า 8,000-15,000 บาท/เดือน เหมาะกับร้านอาหารไทย ส้มตำ อาหารริมโขง

ย่านหน้าด่าน
ใกล้สะพานมิตรภาพ คนข้ามแดนไทย-ลาวผ่านทุกวัน เหมาะกับร้านอาหาร ร้านกาแฟ

ย่านในเมือง — ถนนประจักษ์
ย่านธุรกิจ คนทำงานเยอะ เหมาะกับร้านข้าวราดแกง อาหารจานเดียว ลูกค้ามื้อเที่ยง

ค้นหาร้านอาหารให้เซ้งในหนองคาย ได้ที่ BanChangHub — ทุกประกาศตรวจสอบแล้ว',
NULL, 'tips', ARRAY['เซ้ง','ร้านอาหาร','หนองคาย','ทำเล'], 'published', NOW() - INTERVAL '11 days', 289),

-- ─── กลุ่ม 4: จังหวัดอีสาน ───

(NULL,
'อุดรธานี — เมืองแห่งโอกาส ศูนย์กลางอีสานตอนบน',
'udon-thani-city-guide',
'แนะนำจังหวัดอุดรธานี เศรษฐกิจ การเดินทาง แหล่งท่องเที่ยว ตลาดอสังหาฯ',
'อุดรธานีเป็นจังหวัดที่มีเศรษฐกิจใหญ่เป็นอันดับ 4 ของภาคอีสาน ประชากรกว่า 1.5 ล้านคน เป็นศูนย์กลางธุรกิจและการค้าของอีสานตอนบน

ทำไมอุดรธานีน่าลงทุน:
• มีสนามบินนานาชาติ เชื่อมต่อกรุงเทพฯ เชียงใหม่ ภูเก็ต
• ห้างสรรพสินค้าขนาดใหญ่ Central, UD Town, ตลาดบ้านห้วย
• มหาวิทยาลัยราชภัฏอุดรธานี สถาบันการศึกษาหลายแห่ง
• ตลาดอสังหาฯ เติบโต 15% ต่อปี
• ราคาที่ดินยังไม่แพงเทียบกับเมืองใหญ่

แหล่งท่องเที่ยวสำคัญ:
• ทะเลบัวแดง (บึงหนองหาน) — มรดกโลกทางธรรมชาติ
• พิพิธภัณฑ์บ้านเชียง — แหล่งโบราณคดีมรดกโลก UNESCO
• วัดป่าบ้านตาด — สถานที่ปฏิบัติธรรมชื่อดัง
• หนองประจักษ์ — สวนสาธารณะกลางเมือง

BanChangHub — แพลตฟอร์ม #1 อสังหาฯ อุดรธานี',
NULL, 'general', ARRAY['อุดรธานี','แนะนำ','ลงทุน','ท่องเที่ยว'], 'published', NOW() - INTERVAL '10 days', 623),

(NULL,
'ขอนแก่น — Smart City แห่งอีสาน น่าซื้อบ้านไหม',
'khon-kaen-smart-city-real-estate',
'ขอนแก่นเมือง Smart City ตลาดอสังหาฯ เติบโตเร็ว น่าลงทุนแค่ไหน',
'ขอนแก่นกำลังพัฒนาเป็น Smart City มีรถไฟฟ้า LRT โครงการแรกของภาคอีสาน ตลาดอสังหาฯ เติบโตเร็วมาก

โครงการสำคัญ:
• รถไฟฟ้า LRT ขอนแก่น — เชื่อมต่อเมือง คาดเปิดใช้ปี 2570
• รถไฟความเร็วสูง กรุงเทพฯ-นครราชสีมา-ขอนแก่น
• ศูนย์ประชุมและแสดงสินค้า KICE
• สนามบินขอนแก่น ขยายรันเวย์

ผลกระทบต่อตลาดอสังหาฯ:
• ราคาที่ดินรอบแนวรถไฟฟ้าขึ้น 20-40%
• คอนโดใหม่เกิดขึ้นหลายโครงการ
• บ้านจัดสรรชานเมืองเติบโตต่อเนื่อง

ค้นหาอสังหาฯ ขอนแก่น ได้ที่ BanChangHub',
NULL, 'invest', ARRAY['ขอนแก่น','Smart City','ลงทุน','อสังหา'], 'published', NOW() - INTERVAL '9 days', 445),

(NULL,
'เลย — บ้านวิวภูเขา อากาศดี ราคาถูก',
'loei-mountain-view-house',
'เลย จังหวัดที่อากาศดีที่สุดในอีสาน บ้านวิวภูเขาราคาย่อมเยา น่าซื้อไว้พักผ่อน',
'เลยเป็นจังหวัดที่มีอากาศเย็นสบายที่สุดในภาคอีสาน ล้อมรอบด้วยภูเขา ธรรมชาติสวยงาม เหมาะกับการซื้อบ้านไว้พักผ่อน

ทำไมต้องเลย:
• อุณหภูมิเย็นสบาย 15-25°C ในฤดูหนาว
• ธรรมชาติสวย ภูกระดึง ภูเรือ ภูหลวง
• ราคาบ้านและที่ดินถูกที่สุดในอีสานตอนบน
• เหมาะกับรีสอร์ท โฮมสเตย์ ฟาร์มสเตย์

ราคาตลาด:
• ที่ดิน — 200,000-800,000 บาท/ไร่ (ขึ้นอยู่กับทำเล)
• บ้านเดี่ยว — 1-3 ล้านบาท
• บ้านพร้อมที่ดิน 1 ไร่ — 2-5 ล้านบาท

ค้นหาบ้านวิวภูเขาในเลย ได้ที่ BanChangHub',
NULL, 'general', ARRAY['เลย','ภูเขา','บ้านพักผ่อน','ธรรมชาติ'], 'published', NOW() - INTERVAL '8 days', 334),

(NULL,
'สกลนคร — เมืองสงบ น่าอยู่ อสังหาฯ ราคาดี',
'sakon-nakhon-living-guide',
'สกลนครเมืองที่น่าอยู่ ธรรมชาติสวย ค่าครองชีพต่ำ ตลาดอสังหาฯ ยังมีโอกาส',
'สกลนครเป็นจังหวัดที่สงบ ธรรมชาติสวย มีหนองหานกุมภวาปีเป็นทะเลสาบน้ำจืดขนาดใหญ่ ค่าครองชีพต่ำ

จุดเด่น:
• ธรรมชาติสวย ภูพาน เขื่อนน้ำพุง หนองหาน
• อาหารอร่อยขึ้นชื่อ เนื้อย่าง ส้มตำ ไก่ย่าง
• มหาวิทยาลัยราชภัฏสกลนคร มีนักศึกษาเยอะ
• ค่าครองชีพต่ำ ราคาบ้านเริ่มต้น 1 ล้านบาท

ค้นหาบ้านและที่ดินในสกลนคร ได้ที่ BanChangHub',
NULL, 'general', ARRAY['สกลนคร','น่าอยู่','ธรรมชาติ'], 'published', NOW() - INTERVAL '7 days', 198),

(NULL,
'นครพนม — เมืองริมโขง ศักยภาพการลงทุน',
'nakhon-phanom-investment-guide',
'นครพนมเมืองชายแดนริมโขง เขตเศรษฐกิจพิเศษ โอกาสลงทุนอสังหาฯ',
'นครพนมเป็นเมืองริมแม่น้ำโขงที่สวยงาม มีเขตเศรษฐกิจพิเศษ สะพานมิตรภาพไทย-ลาว แห่งที่ 3

ศักยภาพ:
• เขตเศรษฐกิจพิเศษนครพนม ดึงดูดนักลงทุน
• สะพานมิตรภาพแห่งที่ 3 เชื่อมต่อเวียดนาม
• วิวแม่น้ำโขงสวยที่สุดในอีสาน
• พระธาตุพนม — ศาสนสถานสำคัญ

ค้นหาอสังหาฯ นครพนม ได้ที่ BanChangHub',
NULL, 'invest', ARRAY['นครพนม','ริมโขง','ลงทุน','เขตเศรษฐกิจ'], 'published', NOW() - INTERVAL '6 days', 167),

(NULL,
'หนองบัวลำภู — เมืองเล็ก ราคาบ้านถูก คุ้มค่า',
'nong-bua-lam-phu-affordable-house',
'หนองบัวลำภู จังหวัดเล็กๆ ที่ราคาบ้านถูกที่สุดในอีสานตอนบน',
'หนองบัวลำภูเป็นจังหวัดเล็กๆ ห่างจากอุดรธานีเพียง 60 กม. ราคาบ้านและที่ดินถูกมาก เหมาะกับคนที่ต้องการบ้านราคาประหยัด

ราคาตลาด:
• บ้านเดี่ยว — 800,000-2,000,000 บาท
• ที่ดิน — 100,000-400,000 บาท/ไร่
• ทาวน์โฮม — 700,000-1,500,000 บาท

ค้นหาบ้านราคาดีในหนองบัวลำภู ได้ที่ BanChangHub',
NULL, 'general', ARRAY['หนองบัวลำภู','ราคาถูก','บ้าน'], 'published', NOW() - INTERVAL '5 days', 134),

(NULL,
'บึงกาฬ — จังหวัดใหม่ โอกาสใหม่ อสังหาฯ ราคาต่ำ',
'bueng-kan-new-province-opportunity',
'บึงกาฬจังหวัดน้องใหม่ ราคาที่ดินยังถูก โอกาสทองสำหรับนักลงทุน',
'บึงกาฬเป็นจังหวัดน้องใหม่ แยกจากหนองคายเมื่อปี 2554 ราคาที่ดินยังถูกมาก มีศักยภาพเติบโต

จุดเด่น:
• ราคาที่ดินถูกที่สุดในอีสานตอนบน
• ติดแม่น้ำโขง วิวสวย
• หินสามวาฬ แหล่งท่องเที่ยวชื่อดัง
• ถนนเชื่อมต่อหนองคาย-นครพนม กำลังพัฒนา

ค้นหาที่ดินและบ้านในบึงกาฬ ได้ที่ BanChangHub',
NULL, 'general', ARRAY['บึงกาฬ','จังหวัดใหม่','ลงทุน','ที่ดิน'], 'published', NOW() - INTERVAL '4 days', 98),

-- ─── กลุ่ม 5: ความรู้/เคล็ดลับ ───

(NULL,
'วิธีกู้บ้านให้ผ่าน สำหรับคนอีสาน',
'home-loan-approval-tips-isan',
'เคล็ดลับกู้บ้านให้ผ่านง่าย เตรียมเอกสาร คุณสมบัติ สำหรับคนอีสาน',
'การกู้ซื้อบ้านไม่ยากอย่างที่คิด แต่ต้องเตรียมตัวให้ดี นี่คือเคล็ดลับ:

คุณสมบัติเบื้องต้น:
• อายุ 20 ปีขึ้นไป สัญชาติไทย
• มีรายได้ประจำ หรือรายได้จากธุรกิจ
• ไม่มีประวัติค้างชำระ (เช็คเครดิตบูโร)
• ผ่อนต่อเดือนไม่เกิน 40% ของรายได้

เอกสารที่ต้องเตรียม:
• บัตรประชาชน + ทะเบียนบ้าน
• สลิปเงินเดือน 3-6 เดือนล่าสุด
• Statement บัญชี 6 เดือน
• หนังสือรับรองเงินเดือน
• สำเนาโฉนดที่ดิน

เคล็ดลับให้ผ่าน:
1. เก็บเงินขั้นต่ำ 10-20% ของราคาบ้านเป็นเงินดาวน์
2. ปิดหนี้บัตรเครดิต/สินเชื่อเก่าก่อน
3. ยื่นกู้หลายธนาคารพร้อมกัน
4. เลือกบ้านที่ผ่อนต่อเดือนไม่เกิน 40% ของรายได้

ค้นหาบ้านราคาดี กู้ง่าย ได้ที่ BanChangHub',
NULL, 'tips', ARRAY['กู้บ้าน','สินเชื่อ','ธนาคาร','เคล็ดลับ'], 'published', NOW() - INTERVAL '3 days', 567),

(NULL,
'ค่าธรรมเนียมโอนบ้าน 2569 — ต้องจ่ายเท่าไหร่',
'transfer-fee-house-2569',
'สรุปค่าใช้จ่ายในการโอนบ้าน ค่าธรรมเนียม ภาษี อากร ปี 2569 ครบจบ',
'เมื่อซื้อบ้านแล้ว ต้องจ่ายค่าธรรมเนียมโอนอีก สรุปค่าใช้จ่ายทั้งหมด:

ค่าธรรมเนียมการโอน: 2% ของราคาประเมิน
ค่าอากรแสตมป์: 0.5% ของราคาขายหรือราคาประเมิน (แล้วแต่อันไหนสูงกว่า)
ภาษีธุรกิจเฉพาะ: 3.3% (ถ้าถือครองไม่ถึง 5 ปี)
ภาษีเงินได้หัก ณ ที่จ่าย: ตามขั้นบันได (ดูจากราคาประเมิน)

ตัวอย่าง: บ้านราคา 3 ล้านบาท
• ค่าโอน 2% = 60,000 บาท
• ค่าอากร 0.5% = 15,000 บาท
• ภาษีเงินได้ = ประมาณ 30,000-50,000 บาท (ขึ้นอยู่กับระยะเวลาถือครอง)

รวมประมาณ 100,000-130,000 บาท

ใครจ่าย: ตามที่ตกลงในสัญญา ปกติแบ่งครึ่ง หรือผู้ซื้อรับทั้งหมด

BanChangHub มีเครื่องมือสร้างสัญญาฟรี ระบุค่าใช้จ่ายชัดเจน',
NULL, 'tips', ARRAY['ค่าโอน','ค่าธรรมเนียม','ภาษี','ซื้อบ้าน'], 'published', NOW() - INTERVAL '2 days', 432),

(NULL,
'ฮวงจุ้ยบ้าน — ทิศไหนดี สำหรับคนอีสาน',
'feng-shui-house-direction-isan',
'ฮวงจุ้ยบ้านสำหรับคนอีสาน ทิศหน้าบ้านไหนดี สีบ้านอะไรเสริมดวง',
'คนอีสานให้ความสำคัญกับฮวงจุ้ยและทิศทางบ้าน ความเชื่อผสมกับหลักวิทยาศาสตร์:

ทิศหน้าบ้านที่ดี:
• ทิศเหนือ — เย็นสบาย ลมพัดผ่านดี เหมาะกับอีสาน
• ทิศตะวันออก — รับแสงเช้า สดใส มีพลัง
• ทิศตะวันออกเฉียงเหนือ — ดีสำหรับคนเกิดปีจอ ปีกุน

ทิศที่ควรหลีกเลี่ยง:
• ทิศตะวันตก — แดดบ่ายร้อนจัด ค่าไฟแพง
• หน้าบ้านหันตรงกับถนนตรง (ถนนตัน) — ฮวงจุ้ยไม่ดี

BanChangHub ให้คุณเลือกทิศหน้าบ้านได้ในตัวกรองค้นหา ฟิลเตอร์ "ทิศหน้าบ้าน" พร้อมข้อมูลครบ',
NULL, 'tips', ARRAY['ฮวงจุ้ย','ทิศบ้าน','ความเชื่อ','อีสาน'], 'published', NOW() - INTERVAL '1 day', 287),

(NULL,
'บ้านสัตว์เลี้ยง — สร้างบ้านน้องหมาน้องแมวยังไงให้อยู่สบาย',
'pet-house-design-guide',
'คู่มือสร้างบ้านสัตว์เลี้ยง ออกแบบให้น้องหมาน้องแมวอยู่สบาย ปลอดภัย',
'คนรักสัตว์เลี้ยงในอีสานมีเยอะขึ้นเรื่อยๆ การมีบ้านที่ดีให้น้องหมาน้องแมว สำคัญมาก:

บ้านน้องหมา:
• ขนาดอย่างน้อย 1.5 เท่าของตัวสุนัข
• มีหลังคากันฝนกันแดด ยกพื้นสูง 10-15 ซม.
• วัสดุไม้หรือ WPC ไม่ร้อน ระบายอากาศดี
• ราคา 1,500-5,000 บาท (ขึ้นอยู่กับขนาด)

บ้านน้องแมว:
• แบบหลายชั้น ให้ปีนป่ายได้
• มีที่ซ่อน ที่นอน ที่ลับเล็บ
• ระบายอากาศดี ไม่อบร้อน
• ราคา 2,000-8,000 บาท

BanChangHub รับสร้างบ้านสัตว์เลี้ยง เริ่มต้น 2,500 บาท/หลัง สั่งทำตามขนาด วัสดุปลอดภัย',
NULL, 'tips', ARRAY['สัตว์เลี้ยง','บ้านหมา','บ้านแมว','สร้างบ้าน'], 'published', NOW() - INTERVAL '12 hours', 156)

ON CONFLICT (slug) DO NOTHING;
