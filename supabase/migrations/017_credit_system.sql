-- =============================================
-- 017: Credit/Wallet System
-- =============================================

-- 1. Wallets table (1 per user)
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_topup DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON public.wallets(user_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallets: viewable by owner"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Wallets: admin full access"
  ON public.wallets FOR ALL
  USING (public.is_admin());

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Credit transactions (immutable ledger)
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'spend', 'refund', 'admin_adjust')),
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_tx_type ON public.credit_transactions(type);
CREATE INDEX idx_credit_tx_created ON public.credit_transactions(created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit TX: viewable by owner"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Credit TX: admin full access"
  ON public.credit_transactions FOR ALL
  USING (public.is_admin());

-- 3. Top-up requests
CREATE TABLE public.topup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'promptpay' CHECK (method IN ('promptpay', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),
  slip_url TEXT,
  promptpay_ref TEXT,
  admin_note TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topup_user ON public.topup_requests(user_id);
CREATE INDEX idx_topup_status ON public.topup_requests(status);

ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topup: viewable by owner"
  ON public.topup_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Topup: insertable by owner"
  ON public.topup_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Topup: updatable by owner"
  ON public.topup_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Topup: admin full access"
  ON public.topup_requests FOR ALL
  USING (public.is_admin());

CREATE TRIGGER update_topup_requests_updated_at
  BEFORE UPDATE ON public.topup_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. สร้าง wallet สำหรับ users ที่มีอยู่แล้ว (ทำก่อน trigger เพื่อหลีกเลี่ยง duplicate)
INSERT INTO public.wallets (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 5. Auto-create wallet สำหรับ user ใหม่ (หลังจาก backfill เดิม)
CREATE OR REPLACE FUNCTION public.auto_create_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION auto_create_wallet();

-- 6. confirm_topup() → admin ยืนยันเติมเครดิต
CREATE OR REPLACE FUNCTION public.confirm_topup(p_topup_id UUID)
RETURNS VOID AS $$
DECLARE
  req RECORD;
  new_balance DECIMAL(12,2);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO req FROM public.topup_requests
    WHERE id = p_topup_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Top-up request not found or already processed';
  END IF;

  -- Create wallet if not exists
  INSERT INTO public.wallets (user_id, balance, lifetime_topup)
  VALUES (req.user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Add credits
  UPDATE public.wallets
    SET balance = balance + req.amount,
        lifetime_topup = lifetime_topup + req.amount
    WHERE user_id = req.user_id
    RETURNING balance INTO new_balance;

  -- Record transaction
  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, description, reference_type, reference_id)
  VALUES
    (req.user_id, 'topup', req.amount, new_balance, 'เติมเครดิต ฿' || req.amount, 'topup_request', p_topup_id::TEXT);

  -- Mark confirmed
  UPDATE public.topup_requests
    SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = auth.uid()
    WHERE id = p_topup_id;

  -- Log activity
  PERFORM public.log_activity(
    'topup.confirmed',
    'topup_request',
    p_topup_id::TEXT,
    jsonb_build_object('user_id', req.user_id, 'amount', req.amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. spend_credits() → user ใช้เครดิต
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_amount DECIMAL,
  p_description TEXT,
  p_ref_type TEXT,
  p_ref_id TEXT
)
RETURNS VOID AS $$
DECLARE
  current_balance DECIMAL(12,2);
  new_balance DECIMAL(12,2);
BEGIN
  SELECT balance INTO current_balance FROM public.wallets
    WHERE user_id = auth.uid() FOR UPDATE;

  IF NOT FOUND OR current_balance < p_amount THEN
    RAISE EXCEPTION 'เครดิตไม่เพียงพอ';
  END IF;

  new_balance := current_balance - p_amount;

  UPDATE public.wallets
    SET balance = new_balance,
        lifetime_spent = lifetime_spent + p_amount
    WHERE user_id = auth.uid();

  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, description, reference_type, reference_id)
  VALUES
    (auth.uid(), 'spend', -p_amount, new_balance, p_description, p_ref_type, p_ref_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. admin_adjust_credits() → super admin ปรับยอดเครดิต
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
  new_balance DECIMAL(12,2);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Create wallet if not exists
  INSERT INTO public.wallets (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets
    SET balance = GREATEST(0, balance + p_amount),
        lifetime_topup = CASE WHEN p_amount > 0 THEN lifetime_topup + p_amount ELSE lifetime_topup END
    WHERE user_id = p_user_id
    RETURNING balance INTO new_balance;

  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, description, reference_type, reference_id)
  VALUES
    (p_user_id, 'admin_adjust', p_amount, new_balance, p_reason, 'admin', auth.uid()::TEXT);

  PERFORM public.log_activity(
    'credit.admin_adjusted',
    'wallet',
    p_user_id::TEXT,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'new_balance', new_balance)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
