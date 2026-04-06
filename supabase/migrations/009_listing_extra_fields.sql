-- =============================================
-- 009: Extra listing fields (furnishing, direction, amenities, nearby, year)
-- =============================================

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS furnishing TEXT CHECK (furnishing IN ('none', 'partial', 'full'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS facing TEXT CHECK (facing IN ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS nearby TEXT[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS year_built INT;
