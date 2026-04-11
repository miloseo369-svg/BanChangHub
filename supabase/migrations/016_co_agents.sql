-- =============================================
-- 016: Co-Agent System
-- =============================================

-- 1. เพิ่ม max_co_agents ใน packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS max_co_agents INT DEFAULT 0;

UPDATE public.packages SET max_co_agents = 0 WHERE price = 0;
UPDATE public.packages SET max_co_agents = 2 WHERE name = 'Pro';
UPDATE public.packages SET max_co_agents = 5 WHERE name = 'Business';

-- 2. Co-agents relationship table
CREATE TABLE public.co_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  co_agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  permissions JSONB DEFAULT '{"manage_listings": true, "manage_appointments": true, "view_inquiries": true}',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(primary_agent_id, co_agent_id)
);

CREATE INDEX idx_co_agents_primary ON public.co_agents(primary_agent_id);
CREATE INDEX idx_co_agents_co ON public.co_agents(co_agent_id);
CREATE INDEX idx_co_agents_active ON public.co_agents(co_agent_id, primary_agent_id) WHERE status = 'active';

ALTER TABLE public.co_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Co-agents: viewable by involved parties"
  ON public.co_agents FOR SELECT
  USING (auth.uid() = primary_agent_id OR auth.uid() = co_agent_id OR public.is_admin());

CREATE POLICY "Co-agents: insertable by primary agent"
  ON public.co_agents FOR INSERT
  WITH CHECK (auth.uid() = primary_agent_id);

CREATE POLICY "Co-agents: updatable by involved parties"
  ON public.co_agents FOR UPDATE
  USING (auth.uid() = primary_agent_id OR auth.uid() = co_agent_id OR public.is_admin());

CREATE POLICY "Co-agents: deletable by primary agent"
  ON public.co_agents FOR DELETE
  USING (auth.uid() = primary_agent_id OR public.is_admin());

-- 3. Function: เช็คว่า user เป็น co-agent ของ primary agent หรือไม่
CREATE OR REPLACE FUNCTION public.is_co_agent_of(p_primary_agent_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.co_agents
    WHERE primary_agent_id = p_primary_agent_id
      AND co_agent_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: เช็คว่าเพิ่ม co-agent ได้อีกไหม (ตาม package limit)
CREATE OR REPLACE FUNCTION public.can_add_co_agent(p_agent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_allowed INT;
  current_count INT;
BEGIN
  SELECT p.max_co_agents INTO max_allowed
  FROM public.subscriptions s
  JOIN public.packages p ON p.id = s.package_id
  WHERE s.user_id = p_agent_id AND s.status = 'active' AND s.expires_at > NOW()
  ORDER BY p.max_co_agents DESC
  LIMIT 1;

  IF max_allowed IS NULL THEN max_allowed := 0; END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.co_agents
  WHERE primary_agent_id = p_agent_id AND status IN ('pending', 'active');

  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. เพิ่ม RLS ให้ co-agent เห็น/แก้ listings ของ primary agent
CREATE POLICY "Listings: viewable by co-agent"
  ON public.listings FOR SELECT
  USING (public.is_co_agent_of(user_id));

CREATE POLICY "Listings: editable by co-agent"
  ON public.listings FOR UPDATE
  USING (public.is_co_agent_of(user_id));

-- 6. เพิ่ม RLS ให้ co-agent เห็น appointments ของ primary agent
CREATE POLICY "Appointments: viewable by co-agent"
  ON public.appointments FOR SELECT
  USING (public.is_co_agent_of(agent_id));

CREATE POLICY "Appointments: updatable by co-agent"
  ON public.appointments FOR UPDATE
  USING (public.is_co_agent_of(agent_id));

-- 7. เพิ่ม RLS ให้ co-agent เห็น inquiries ของ primary agent
CREATE POLICY "Inquiries: viewable by co-agent"
  ON public.inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND public.is_co_agent_of(l.user_id)
    )
  );
