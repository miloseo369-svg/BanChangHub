-- =============================================
-- 015: Super Admin Role + Activity Logs
-- =============================================

-- 1. เพิ่ม super_admin ใน role constraint
-- PostgreSQL auto-names inline CHECK as {table}_{column}_check
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'agent', 'contractor', 'admin', 'super_admin'));

-- 2. อัปเดต is_admin() → รองรับ super_admin ด้วย
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. สร้าง is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Activity Logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_actor ON public.activity_logs(actor_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- เฉพาะ admin ดู log ได้
CREATE POLICY "Activity logs: admin read"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin());

-- insert ได้จาก SECURITY DEFINER functions และ authenticated users (สำหรับ client-side logging)
CREATE POLICY "Activity logs: authenticated insert"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Helper function: log_activity()
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. admin_update_role() → ป้องกัน privilege escalation + log อัตโนมัติ
CREATE OR REPLACE FUNCTION public.admin_update_role(p_user_id UUID, p_new_role TEXT)
RETURNS VOID AS $$
DECLARE
  actor_role TEXT;
  target_role TEXT;
BEGIN
  -- ตรวจสอบ role ใหม่ว่าถูกต้อง
  IF p_new_role NOT IN ('user', 'agent', 'contractor', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Role ไม่ถูกต้อง: %', p_new_role;
  END IF;

  -- ดึง role ของผู้ทำ
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();

  -- ต้องเป็น admin ขึ้นไป
  IF actor_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- ดึง role เป้าหมาย
  SELECT role INTO target_role FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- ห้าม admin แก้ super_admin
  IF target_role = 'super_admin' AND actor_role != 'super_admin' THEN
    RAISE EXCEPTION 'ไม่สามารถแก้ไข Super Admin ได้';
  END IF;

  -- ห้าม admin ตั้ง super_admin
  IF p_new_role = 'super_admin' AND actor_role != 'super_admin' THEN
    RAISE EXCEPTION 'เฉพาะ Super Admin เท่านั้นที่ตั้ง Super Admin ได้';
  END IF;

  -- ห้ามแก้ role ตัวเอง
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'ไม่สามารถเปลี่ยน Role ตัวเองได้';
  END IF;

  -- อัปเดต role
  UPDATE public.profiles SET role = p_new_role, updated_at = NOW() WHERE id = p_user_id;

  -- Log activity
  PERFORM public.log_activity(
    'user.role_changed',
    'profile',
    p_user_id::TEXT,
    jsonb_build_object('old_role', target_role, 'new_role', p_new_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. อัปเดต confirm_payment() → เพิ่ม logging
CREATE OR REPLACE FUNCTION public.confirm_payment(payment_id UUID)
RETURNS VOID AS $$
DECLARE
  p RECORD;
  pkg RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO p FROM public.payments WHERE id = payment_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;

  SELECT * INTO pkg FROM public.packages WHERE id = p.package_id;

  UPDATE public.payments SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = auth.uid()
  WHERE id = payment_id;

  INSERT INTO public.subscriptions (user_id, package_id, starts_at, expires_at)
  VALUES (
    p.user_id,
    p.package_id,
    NOW(),
    NOW() + (pkg.duration_days || ' days')::INTERVAL
  );

  -- Log
  PERFORM public.log_activity(
    'payment.confirmed',
    'payment',
    payment_id::TEXT,
    jsonb_build_object('user_id', p.user_id, 'amount', p.amount, 'package', pkg.name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Promote to super_admin function
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super_admin can promote';
  END IF;

  SELECT id INTO target_id FROM auth.users WHERE email = user_email;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.profiles SET role = 'super_admin', is_verified = TRUE WHERE id = target_id;

  PERFORM public.log_activity(
    'user.promoted_super_admin',
    'profile',
    target_id::TEXT,
    jsonb_build_object('email', user_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
