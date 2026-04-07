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
