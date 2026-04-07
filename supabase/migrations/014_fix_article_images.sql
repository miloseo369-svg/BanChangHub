-- =============================================
-- 014: Fix article images — ใช้รูปที่ตรงกับเนื้อหา
-- =============================================

-- ซื้อบ้าน
UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' WHERE slug = '5-things-check-before-buying-house-isan';
-- บ้านสมัยใหม่ สวย

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80' WHERE slug = 'best-location-udon-thani-2569';
-- บ้านหรู สวน

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80' WHERE slug = 'buying-house-nong-khai-mekong';
-- แม่น้ำ สะพาน (คล้ายริมโขง)

-- สร้าง/รีโนเวท
UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80' WHERE slug = 'renovate-old-house-500k-budget';
-- งานรีโนเวท ช่าง

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80' WHERE slug = 'build-vs-buy-house-isan';
-- บ้านสร้างใหม่

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80' WHERE slug = 'knockdown-house-guide-price';
-- บ้านไม้เล็ก

-- เซ้งกิจการ
UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80' WHERE slug = 'transfer-coffee-shop-isan-guide';
-- กาแฟ

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80' WHERE slug = 'best-location-restaurant-nong-khai';
-- ร้านอาหาร

-- จังหวัดอีสาน
UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80' WHERE slug = 'udon-thani-city-guide';
-- เมืองใหญ่ ตึก

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80' WHERE slug = 'khon-kaen-smart-city-real-estate';
-- เมือง smart city

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' WHERE slug = 'loei-mountain-view-house';
-- ภูเขา (ตรงแล้ว)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' WHERE slug = 'sakon-nakhon-living-guide';
-- ทุ่งนา ธรรมชาติ (ตรงแล้ว)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' WHERE slug = 'nakhon-phanom-investment-guide';
-- เมืองริมน้ำ (แก้จากเรือทะเลใต้)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80' WHERE slug = 'nong-bua-lam-phu-affordable-house';
-- บ้านเล็กน่ารัก (ตรงแล้ว)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80' WHERE slug = 'bueng-kan-new-province-opportunity';
-- ธรรมชาติ ป่าเขา (แก้จากภูเขาหิมะ)

-- ความรู้/เคล็ดลับ
UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80' WHERE slug = 'home-loan-approval-tips-isan';
-- กุญแจบ้าน (ตรงแล้ว)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80' WHERE slug = 'transfer-fee-house-2569';
-- เอกสาร เงิน (ตรงแล้ว)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80' WHERE slug = 'feng-shui-house-direction-isan';
-- บ้าน สวน (ตรงแล้ว)

UPDATE public.articles SET cover_image = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80' WHERE slug = 'pet-house-design-guide';
-- สุนัขน่ารัก (เปลี่ยนรูปใหม่ให้ชัดขึ้น)
