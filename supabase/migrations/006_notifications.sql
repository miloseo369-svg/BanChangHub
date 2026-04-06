-- =============================================
-- 006: Notifications
-- =============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'inquiry', 'listing_approved', 'listing_rejected', 'payment_confirmed', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL ที่คลิกไปได้
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: viewable by owner"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications: updatable by owner"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications: insertable by system"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- ใช้ trigger/function สร้าง

CREATE POLICY "Notifications: admin full access"
  ON public.notifications FOR ALL
  USING (public.is_admin());

-- Trigger: สร้าง notification เมื่อมีนัดหมายใหม่
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.agent_id,
    'appointment',
    'มีนัดหมายใหม่',
    'มีคนนัดดูทรัพย์สินของคุณ วันที่ ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY'),
    '/dashboard/appointments'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();

-- Trigger: แจ้งเตือนเมื่อมี inquiry ใหม่
CREATE OR REPLACE FUNCTION notify_new_inquiry()
RETURNS TRIGGER AS $$
DECLARE
  listing_owner UUID;
BEGIN
  SELECT user_id INTO listing_owner FROM public.listings WHERE id = NEW.listing_id;
  IF listing_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      listing_owner,
      'inquiry',
      'มีข้อความใหม่',
      COALESCE(NEW.sender_name, 'ผู้สนใจ') || ' สอบถามเกี่ยวกับประกาศของคุณ',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_inquiry
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_inquiry();
