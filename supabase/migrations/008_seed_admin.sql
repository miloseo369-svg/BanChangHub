-- =============================================
-- 008: Seed Admin Account
-- =============================================
-- วิธีใช้: หลัง deploy แล้ว สมัครสมาชิกด้วยอีเมล admin ก่อน
-- แล้ว run SQL นี้ใน Supabase SQL Editor เพื่อ promote เป็น admin
--
-- เปลี่ยนอีเมลด้านล่างเป็นอีเมลจริงของ admin

-- ตัวอย่าง: promote user เป็น admin ด้วยอีเมล
-- UPDATE public.profiles
-- SET role = 'admin', is_verified = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@banchanghub.com');

-- Function: ใช้ promote admin จาก Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = user_email;

  IF target_id IS NULL THEN
    RETURN 'ไม่พบ user ด้วยอีเมล: ' || user_email;
  END IF;

  UPDATE public.profiles
  SET role = 'admin', is_verified = true
  WHERE id = target_id;

  RETURN 'สำเร็จ: ' || user_email || ' เป็น admin แล้ว';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
