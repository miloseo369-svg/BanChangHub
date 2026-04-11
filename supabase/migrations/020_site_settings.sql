-- Site settings — แอดมินแก้ไขได้ผ่านหน้า admin
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ทุกคนอ่านได้ (ใช้แสดง contact info ในหน้าเว็บ)
CREATE POLICY "site_settings_read" ON public.site_settings
  FOR SELECT USING (true);

-- admin เท่านั้นที่แก้ได้
CREATE POLICY "site_settings_admin_write" ON public.site_settings
  FOR UPDATE USING (public.is_admin());

-- Seed ค่าเริ่มต้น
INSERT INTO public.site_settings (key, value, label) VALUES
  ('contact_phone', '0806329997', 'เบอร์โทรติดต่อ'),
  ('promptpay_id', '0806329997', 'PromptPay ID'),
  ('line_id', '', 'LINE Official ID'),
  ('line_url', '', 'LINE URL (https://line.me/...)'),
  ('facebook_url', '', 'Facebook Page URL'),
  ('email', '', 'อีเมลติดต่อ')
ON CONFLICT (key) DO NOTHING;
