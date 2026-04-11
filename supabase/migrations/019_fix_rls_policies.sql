-- =============================================
-- 019: Fix RLS Policies — Security Hardening
-- =============================================

-- ==========================================
-- 1. topup_requests: user ห้ามแก้ status/confirmed fields
--    CRITICAL: เดิม user UPDATE ได้ทุก column → เปลี่ยน status เองได้
-- ==========================================
DROP POLICY IF EXISTS "Topup: updatable by owner" ON public.topup_requests;

-- user อัปเดตได้เฉพาะ slip_url เท่านั้น (ห้ามแก้ status, confirmed_at, confirmed_by, admin_note)
CREATE POLICY "Topup: owner can upload slip"
  ON public.topup_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- เพิ่ม trigger ป้องกันซ้ำ: user ห้ามแก้ fields ที่ไม่ใช่ slip_url
CREATE OR REPLACE FUNCTION public.restrict_topup_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- ถ้าเป็น admin ให้ผ่านหมด
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- user ห้ามแก้ fields เหล่านี้
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
     OR NEW.confirmed_by IS DISTINCT FROM OLD.confirmed_by
     OR NEW.admin_note IS DISTINCT FROM OLD.admin_note
     OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.method IS DISTINCT FROM OLD.method
  THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS restrict_topup_update ON public.topup_requests;
CREATE TRIGGER restrict_topup_update
  BEFORE UPDATE ON public.topup_requests
  FOR EACH ROW EXECUTE FUNCTION restrict_topup_user_update();

-- ==========================================
-- 2. co_agents: co-agent ห้าม self-approve pending → active
--    CRITICAL: เดิม co_agent_id UPDATE status ได้เอง
--    ใช้ trigger แทน RLS เพราะ OLD/NEW ใช้ใน policy ไม่ได้
-- ==========================================
DROP POLICY IF EXISTS "Co-agents: updatable by either party" ON public.co_agents;

-- Primary agent แก้ได้ทุกอย่าง (revoke, permissions)
CREATE POLICY "Co-agents: updatable by primary"
  ON public.co_agents FOR UPDATE
  USING (auth.uid() = primary_agent_id)
  WITH CHECK (auth.uid() = primary_agent_id);

-- Co-agent แก้ได้เฉพาะ record ตัวเอง (trigger จะจำกัด status transition)
CREATE POLICY "Co-agents: updatable by co-agent"
  ON public.co_agents FOR UPDATE
  USING (auth.uid() = co_agent_id)
  WITH CHECK (auth.uid() = co_agent_id);

-- Admin แก้ได้ทุกอย่าง
CREATE POLICY "Co-agents: admin full access"
  ON public.co_agents FOR ALL
  USING (public.is_admin());

-- Trigger: จำกัด co-agent ให้เปลี่ยน status ได้เฉพาะ transition ที่อนุญาต
CREATE OR REPLACE FUNCTION public.restrict_co_agent_update()
RETURNS TRIGGER AS $$
BEGIN
  -- admin / primary agent ผ่านหมด
  IF public.is_admin() OR auth.uid() = OLD.primary_agent_id THEN
    RETURN NEW;
  END IF;

  -- co-agent: ต้องเป็นเจ้าของ record
  IF auth.uid() != OLD.co_agent_id THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์แก้ไข';
  END IF;

  -- co-agent ห้ามแก้ permissions
  IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
    RAISE EXCEPTION 'Co-agent ไม่สามารถแก้สิทธิ์ได้';
  END IF;

  -- จำกัด status transition:
  --   pending → active (ตอบรับ)
  --   pending → revoked (ปฏิเสธ)
  --   active → revoked (ลาออก)
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'pending' AND NEW.status IN ('active', 'revoked'))
      OR (OLD.status = 'active' AND NEW.status = 'revoked')
    ) THEN
      RAISE EXCEPTION 'ไม่สามารถเปลี่ยนสถานะได้';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS restrict_co_agent_update ON public.co_agents;
CREATE TRIGGER restrict_co_agent_update
  BEFORE UPDATE ON public.co_agents
  FOR EACH ROW EXECUTE FUNCTION restrict_co_agent_update();

-- ==========================================
-- 3. listings/appointments/clients: co-agent ห้ามแก้ owner fields
--    CRITICAL: เดิม UPDATE ไม่มี WITH CHECK → แก้ user_id ได้
--    ใช้ trigger ป้องกันเพราะ WITH CHECK (col = col) เทียบตัวเองจะ true เสมอ
-- ==========================================

-- Listings: co-agent แก้ได้ (trigger จะเช็คว่าห้ามเปลี่ยน user_id)
DROP POLICY IF EXISTS "Listings: editable by co-agent" ON public.listings;
CREATE POLICY "Listings: editable by co-agent"
  ON public.listings FOR UPDATE
  USING (public.is_co_agent_of(user_id));

-- Appointments: co-agent แก้ได้ (trigger จะเช็คว่าห้ามเปลี่ยน agent_id)
DROP POLICY IF EXISTS "Appointments: updatable by co-agent" ON public.appointments;
CREATE POLICY "Appointments: updatable by co-agent"
  ON public.appointments FOR UPDATE
  USING (public.is_co_agent_of(agent_id));

-- Clients: เจ้าของแก้ได้
DROP POLICY IF EXISTS "Clients: updatable by agent or co-agent" ON public.clients;
CREATE POLICY "Clients: updatable by owner"
  ON public.clients FOR UPDATE
  USING (auth.uid() = agent_id);

-- Clients: co-agent แก้ได้ (trigger จะเช็คว่าห้ามเปลี่ยน agent_id)
CREATE POLICY "Clients: updatable by co-agent"
  ON public.clients FOR UPDATE
  USING (public.is_co_agent_of(agent_id));

-- Trigger: ป้องกัน co-agent เปลี่ยน ownership fields
CREATE OR REPLACE FUNCTION public.protect_owner_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- admin ผ่านหมด
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- ป้องกันเปลี่ยน user_id ใน listings
  IF TG_TABLE_NAME = 'listings' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ไม่สามารถเปลี่ยนเจ้าของประกาศได้';
  END IF;

  -- ป้องกันเปลี่ยน agent_id ใน appointments
  IF TG_TABLE_NAME = 'appointments' AND NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
    RAISE EXCEPTION 'ไม่สามารถเปลี่ยนเจ้าของนัดหมายได้';
  END IF;

  -- ป้องกันเปลี่ยน agent_id ใน clients
  IF TG_TABLE_NAME = 'clients' AND NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
    RAISE EXCEPTION 'ไม่สามารถเปลี่ยนเจ้าของลูกค้าได้';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_listing_owner ON public.listings;
CREATE TRIGGER protect_listing_owner
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION protect_owner_fields();

DROP TRIGGER IF EXISTS protect_appointment_owner ON public.appointments;
CREATE TRIGGER protect_appointment_owner
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION protect_owner_fields();

DROP TRIGGER IF EXISTS protect_client_owner ON public.clients;
CREATE TRIGGER protect_client_owner
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION protect_owner_fields();

-- ==========================================
-- 4. organization_members: manager ห้ามสร้าง owner role
-- ==========================================
DROP POLICY IF EXISTS "Org members: insertable by owner or manager" ON public.organization_members;
CREATE POLICY "Org members: insertable by owner or manager"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    -- owner สร้างได้ทุก role
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
    OR (
      -- manager สร้างได้เฉพาะ member/manager (ห้าม owner)
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
      )
      AND role IN ('member', 'manager')
    )
  );

-- ==========================================
-- 5. activity_logs: จำกัด INSERT ให้เฉพาะ authenticated + ผ่าน function
-- ==========================================
DROP POLICY IF EXISTS "Activity logs: insertable by authenticated" ON public.activity_logs;
CREATE POLICY "Activity logs: insertable by authenticated"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND actor_id = auth.uid());
