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
