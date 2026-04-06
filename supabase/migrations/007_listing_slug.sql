-- =============================================
-- 007: Listing slug for SEO-friendly URLs
-- =============================================

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);

-- Auto-generate slug from title on insert
CREATE OR REPLACE FUNCTION generate_listing_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Convert title to slug: lowercase, replace spaces with dashes, keep thai chars
  base_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.title), '[^a-z0-9ก-๙]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := LEFT(base_slug, 80);

  -- Append listing_code for uniqueness
  IF NEW.listing_code IS NOT NULL THEN
    base_slug := base_slug || '-' || LOWER(NEW.listing_code);
  END IF;

  final_slug := base_slug;

  -- Handle duplicates
  WHILE EXISTS (SELECT 1 FROM public.listings WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listing_slug
  BEFORE INSERT OR UPDATE OF title ON public.listings
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_listing_slug();
