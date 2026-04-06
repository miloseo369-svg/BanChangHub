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
