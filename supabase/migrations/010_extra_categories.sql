-- =============================================
-- 010: Extra service categories
-- =============================================

INSERT INTO public.categories (name, slug, type, sort_order) VALUES
  ('บ้านน็อคดาวน์', 'knockdown', 'service', 5),
  ('บ้านสัตว์เลี้ยง', 'pet-house', 'service', 6)
ON CONFLICT (slug) DO NOTHING;
