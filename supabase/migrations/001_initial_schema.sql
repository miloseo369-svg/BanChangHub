-- =============================================
-- BanChangHub Database Schema
-- =============================================

-- 1. PROFILES (ข้อมูลผู้ใช้เพิ่มเติมจาก auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'contractor', 'admin')),
  company_name TEXT,
  line_id TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES (หมวดหมู่ประกาศ)
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('property', 'service', 'marketplace')),
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- ข้อมูลเริ่มต้น categories
INSERT INTO public.categories (name, slug, type, sort_order) VALUES
  ('บ้านเดี่ยว', 'detached-house', 'property', 1),
  ('ทาวน์โฮม', 'townhome', 'property', 2),
  ('คอนโด', 'condo', 'property', 3),
  ('ที่ดินเปล่า', 'land', 'property', 4),
  ('อาคารพาณิชย์', 'commercial', 'property', 5),
  ('สร้างบ้านใหม่', 'build-new', 'service', 1),
  ('รีโนเวท', 'renovate', 'service', 2),
  ('ต่อเติม', 'extend', 'service', 3),
  ('ซ่อมแซม', 'repair', 'service', 4),
  ('ร้านอาหาร', 'restaurant', 'marketplace', 1),
  ('ร้านกาแฟ', 'cafe', 'marketplace', 2),
  ('ร้านค้า', 'retail', 'marketplace', 3),
  ('โรงแรม/ที่พัก', 'hotel', 'marketplace', 4),
  ('อื่นๆ', 'other', 'marketplace', 5);

-- 3. PROVINCES (จังหวัด)
CREATE TABLE public.provinces (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

INSERT INTO public.provinces (name, slug) VALUES
  ('อุดรธานี', 'udon-thani'),
  ('หนองคาย', 'nong-khai'),
  ('ขอนแก่น', 'khon-kaen'),
  ('เลย', 'loei'),
  ('หนองบัวลำภู', 'nong-bua-lam-phu'),
  ('สกลนคร', 'sakon-nakhon'),
  ('นครพนม', 'nakhon-phanom'),
  ('บึงกาฬ', 'bueng-kan');

-- 4. LISTINGS (ประกาศทรัพย์/เซ้ง)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_code TEXT UNIQUE, -- รหัสทรัพย์ BCH-XXXXXXXX
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id INT REFERENCES public.categories(id),
  province_id INT REFERENCES public.provinces(id),

  -- ข้อมูลหลัก
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('property', 'marketplace')),
  listing_type TEXT DEFAULT 'sell' CHECK (listing_type IN ('sell', 'rent', 'transfer')), -- ขาย/เช่า/เซ้ง

  -- ราคา
  price DECIMAL(15,2),
  price_per_sqm DECIMAL(10,2),

  -- ที่อยู่
  address TEXT,
  district TEXT, -- อำเภอ
  sub_district TEXT, -- ตำบล
  postal_code TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),

  -- สเปคบ้าน
  bedrooms INT,
  bathrooms INT,
  parking INT,
  floor_area DECIMAL(10,2), -- พื้นที่ใช้สอย ตร.ม.
  land_area TEXT, -- เนื้อที่ดิน เช่น "60 ตร.วา"
  floors INT, -- จำนวนชั้น

  -- สถานะ
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'sold', 'expired', 'rejected')),
  is_certified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_boosted BOOLEAN DEFAULT FALSE,
  boost_expires_at TIMESTAMPTZ,

  -- สถิติ
  view_count INT DEFAULT 0,
  save_count INT DEFAULT 0,
  contact_count INT DEFAULT 0,

  -- timestamps
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate listing_code
CREATE OR REPLACE FUNCTION generate_listing_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.listing_code := 'BCH-' || TO_CHAR(NOW(), 'YYMM') || LPAD(NEXTVAL('listing_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS listing_code_seq START 1;

CREATE TRIGGER set_listing_code
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  WHEN (NEW.listing_code IS NULL)
  EXECUTE FUNCTION generate_listing_code();

-- 5. LISTING_IMAGES (รูปภาพประกาศ)
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INT DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FAVORITES (บันทึกรายการโปรด)
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 7. INQUIRIES (สอบถาม/ติดต่อ)
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_phone TEXT,
  sender_email TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REVIEWS (รีวิว)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- ผู้ถูกรีวิว
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ARTICLES (บทความ)
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  view_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BANNERS (แบนเนอร์โฆษณา)
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  position TEXT DEFAULT 'top' CHECK (position IN ('top', 'hero', 'sidebar', 'listing')),
  bg_gradient TEXT, -- เช่น "from-[#1e3a5f] to-[#0d9488]"
  subtitle TEXT,
  cta_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  click_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PACKAGES (แพ็กเกจสมาชิก)
CREATE TABLE public.packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  max_listings INT DEFAULT 1,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.packages (name, price, duration_days, max_listings, features, sort_order) VALUES
  ('ฟรี', 0, 30, 1, '{"boost": false, "certified": false, "priority_support": false}', 1),
  ('Pro', 299, 30, 10, '{"boost": true, "certified": false, "priority_support": true}', 2),
  ('Business', 799, 30, -1, '{"boost": true, "certified": true, "priority_support": true}', 3);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_category_id ON public.listings(category_id);
CREATE INDEX idx_listings_province_id ON public.listings(province_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_is_featured ON public.listings(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_inquiries_listing_id ON public.inquiries(listing_id);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_inquiries_sender_id ON public.inquiries(sender_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_target_id ON public.reviews(target_id);
CREATE INDEX idx_favorites_listing_id ON public.favorites(listing_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Profiles: ดูได้ทุกคน, แก้ได้เฉพาะตัวเอง
CREATE POLICY "Profiles: viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: editable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings: ดูได้เฉพาะ active, เจ้าของดู/แก้ได้ทุกสถานะ
CREATE POLICY "Listings: active viewable by everyone" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Listings: insertable by authenticated" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Listings: editable by owner" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Listings: deletable by owner" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- Listing Images: ดูได้ทุกคน, จัดการได้เฉพาะเจ้าของ listing
CREATE POLICY "Images: viewable by everyone" ON public.listing_images FOR SELECT USING (true);
CREATE POLICY "Images: manageable by listing owner" ON public.listing_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);

-- Favorites: ดู/จัดการได้เฉพาะตัวเอง
CREATE POLICY "Favorites: viewable by owner" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Favorites: manageable by owner" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Inquiries: เจ้าของ listing เห็น, ผู้ส่งเห็น, ใครก็ส่งได้
CREATE POLICY "Inquiries: viewable by listing owner or sender" ON public.inquiries FOR SELECT USING (
  auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Inquiries: insertable by authenticated" ON public.inquiries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews: ดูได้ทุกคน, เขียนได้เฉพาะ authenticated
CREATE POLICY "Reviews: viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews: insertable by authenticated" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Articles: ดูได้เฉพาะ published, เจ้าของเห็นทุกสถานะ
CREATE POLICY "Articles: published viewable by everyone" ON public.articles FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
CREATE POLICY "Articles: insertable by authenticated" ON public.articles FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Articles: editable by author" ON public.articles FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Articles: deletable by author" ON public.articles FOR DELETE USING (auth.uid() = author_id);

-- Banners: ดูได้เฉพาะ active
CREATE POLICY "Banners: active viewable by everyone" ON public.banners FOR SELECT USING (is_active = true);

-- Categories, Provinces, Packages: ดูได้ทุกคน
CREATE POLICY "Categories: viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Provinces: viewable by everyone" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Packages: viewable by everyone" ON public.packages FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment view count
CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET view_count = view_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
