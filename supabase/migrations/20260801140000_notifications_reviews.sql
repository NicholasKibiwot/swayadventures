-- Migration: notifications and tour reviews
-- Timestamp: 20260801140000

-- ============================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_created' | 'booking_status_changed' | 'booking_refunded'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id TEXT REFERENCES public."Booking"(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- ============================================================
-- 2. TOUR REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.TourReview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public."Trip"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public."Booking"(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewer_name TEXT NOT NULL DEFAULT '',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tourreview_trip_id ON public."TourReview"(trip_id);
CREATE INDEX IF NOT EXISTS idx_tourreview_user_id ON public."TourReview"(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tourreview_user_trip ON public."TourReview"(user_id, trip_id);

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TourReview" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. ADMIN FUNCTION (already exists, reuse)
-- ============================================================
-- is_admin_from_auth() already created in previous migration

-- ============================================================
-- 5. RLS POLICIES - NOTIFICATIONS
-- ============================================================
DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
CREATE POLICY "users_view_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_from_auth());

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_from_auth())
WITH CHECK (user_id = auth.uid() OR public.is_admin_from_auth());

DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;
CREATE POLICY "service_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_notifications" ON public.notifications;
CREATE POLICY "admin_delete_notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_from_auth());

-- ============================================================
-- 6. RLS POLICIES - TOUR REVIEWS
-- ============================================================
DROP POLICY IF EXISTS "public_read_tourreviews" ON public."TourReview";
CREATE POLICY "public_read_tourreviews"
ON public."TourReview"
FOR SELECT
TO public
USING (is_approved = true);

DROP POLICY IF EXISTS "users_insert_own_tourreviews" ON public."TourReview";
CREATE POLICY "users_insert_own_tourreviews"
ON public."TourReview"
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_tourreviews" ON public."TourReview";
CREATE POLICY "users_update_own_tourreviews"
ON public."TourReview"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_from_auth())
WITH CHECK (user_id = auth.uid() OR public.is_admin_from_auth());

DROP POLICY IF EXISTS "users_delete_own_tourreviews" ON public."TourReview";
CREATE POLICY "users_delete_own_tourreviews"
ON public."TourReview"
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_from_auth());

-- ============================================================
-- 7. FUNCTION: auto-notify on booking changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_trip_title TEXT;
  v_notif_title TEXT;
  v_notif_message TEXT;
  v_type TEXT;
BEGIN
  -- Get trip title
  SELECT title INTO v_trip_title FROM public."Trip" WHERE id = NEW."tripId" LIMIT 1;
  IF v_trip_title IS NULL THEN
    v_trip_title := 'your tour';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_type := 'booking_created';
    v_notif_title := 'Booking Confirmed';
    v_notif_message := 'Your booking for ' || v_trip_title || ' (Ref: ' || NEW.reference || ') has been received.';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'REFUNDED' OR NEW.payment_status = 'refunded' THEN
        v_type := 'booking_refunded';
        v_notif_title := 'Booking Refunded';
        v_notif_message := 'Your booking for ' || v_trip_title || ' (Ref: ' || NEW.reference || ') has been refunded.';
      ELSE
        v_type := 'booking_status_changed';
        v_notif_title := 'Booking Status Updated';
        v_notif_message := 'Your booking for ' || v_trip_title || ' is now ' || NEW.status || '.';
      END IF;
    ELSIF OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'refunded' THEN
      v_type := 'booking_refunded';
      v_notif_title := 'Booking Refunded';
      v_notif_message := 'Your booking for ' || v_trip_title || ' (Ref: ' || NEW.reference || ') has been refunded.';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Notify the customer (user_id on booking)
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, booking_id)
    VALUES (NEW.user_id, v_type, v_notif_title, v_notif_message, NEW.id);
  END IF;

  -- Also notify all admins
  INSERT INTO public.notifications (user_id, type, title, message, booking_id)
  SELECT au.id, v_type,
    CASE WHEN TG_OP = 'INSERT' THEN 'New Booking Received'
         WHEN v_type = 'booking_refunded' THEN 'Booking Refunded'
         ELSE 'Booking Status Changed' END,
    CASE WHEN TG_OP = 'INSERT' THEN 'New booking for ' || v_trip_title || ' (Ref: ' || NEW.reference || ').'
         ELSE 'Booking ' || NEW.reference || ' status changed to ' || NEW.status || '.' END,
    NEW.id
  FROM auth.users au
  WHERE (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
    AND (NEW.user_id IS NULL OR au.id != NEW.user_id);

  RETURN NEW;
END;
$func$;

-- ============================================================
-- 8. TRIGGER on Booking
-- ============================================================
DROP TRIGGER IF EXISTS trg_booking_notify ON public."Booking";
CREATE TRIGGER trg_booking_notify
AFTER INSERT OR UPDATE ON public."Booking"
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking_change();

-- ============================================================
-- 9. FUNCTION: update TourReview updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_tourreview_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_tourreview_updated_at ON public."TourReview";
CREATE TRIGGER trg_tourreview_updated_at
BEFORE UPDATE ON public."TourReview"
FOR EACH ROW
EXECUTE FUNCTION public.update_tourreview_updated_at();
