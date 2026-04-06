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
