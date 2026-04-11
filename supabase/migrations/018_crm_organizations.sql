-- =============================================
-- 018: CRM (Client Management) + Organizations
-- =============================================

-- ==========================================
-- 1. Clients table (CRM contacts for agents)
-- ==========================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  line_id TEXT,
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),
  preferred_types TEXT[],
  preferred_provinces INT[],
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hot', 'warm', 'cold', 'closed')),
  source TEXT CHECK (source IN ('website', 'line', 'referral', 'walk-in', 'facebook', 'other')),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_agent ON public.clients(agent_id);
CREATE INDEX idx_clients_status ON public.clients(status);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients: viewable by owner or co-agent"
  ON public.clients FOR SELECT
  USING (auth.uid() = agent_id OR public.is_co_agent_of(agent_id) OR public.is_admin());

CREATE POLICY "Clients: insertable by agent"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Clients: editable by owner or co-agent"
  ON public.clients FOR UPDATE
  USING (auth.uid() = agent_id OR public.is_co_agent_of(agent_id));

CREATE POLICY "Clients: deletable by owner"
  ON public.clients FOR DELETE
  USING (auth.uid() = agent_id);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 2. Client interactions log
-- ==========================================
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'line', 'meeting', 'showing', 'note', 'email')),
  summary TEXT,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_interactions_client ON public.client_interactions(client_id);

ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client interactions: viewable by agent or co-agent"
  ON public.client_interactions FOR SELECT
  USING (
    auth.uid() = agent_id OR
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND (c.agent_id = auth.uid() OR public.is_co_agent_of(c.agent_id)))
    OR public.is_admin()
  );

CREATE POLICY "Client interactions: insertable by agent"
  ON public.client_interactions FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Client interactions: deletable by agent"
  ON public.client_interactions FOR DELETE
  USING (auth.uid() = agent_id);

-- ==========================================
-- 3. Organizations + Members
--    สร้าง tables ทั้ง 2 ก่อน แล้วค่อยสร้าง policies
--    เพื่อหลีกเลี่ยง circular reference error
-- ==========================================

-- สร้าง organizations table (ยังไม่สร้าง policy)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- สร้าง organization_members table (ยังไม่สร้าง policy)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org ON public.organization_members(org_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Policies สำหรับ organizations (ตอนนี้ organization_members มีแล้ว)
-- ==========================================
CREATE POLICY "Orgs: viewable by members"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = id AND user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Orgs: insertable by authenticated"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Orgs: editable by owner"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Orgs: deletable by owner"
  ON public.organizations FOR DELETE
  USING (auth.uid() = owner_id);

-- ==========================================
-- 5. Policies สำหรับ organization_members
-- ==========================================
CREATE POLICY "Org members: viewable by org owner or members"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = org_id AND om.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Org members: insertable by org owner/manager"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Org members: deletable by org owner"
  ON public.organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id AND om.user_id = auth.uid() AND om.role = 'owner'
    )
  );

-- ==========================================
-- 6. Triggers
-- ==========================================
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
