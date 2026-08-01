-- Bookings RLS Migration
-- Adds user_id to Booking table and sets up RLS policies for user and admin access

-- 1. Add user_id column to Booking if not exists
ALTER TABLE public."Booking"
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_booking_user_id ON public."Booking"(user_id);

-- 2. Add payment_status column to Booking for quick status tracking
ALTER TABLE public."Booking"
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- 3. Enable RLS on Booking
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on Payment
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on Customer
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;

-- 6. Booking RLS policies
-- Users can read their own bookings
DROP POLICY IF EXISTS "users_read_own_bookings" ON public."Booking";
CREATE POLICY "users_read_own_bookings"
ON public."Booking"
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own bookings
DROP POLICY IF EXISTS "users_insert_own_bookings" ON public."Booking";
CREATE POLICY "users_insert_own_bookings"
ON public."Booking"
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own bookings
DROP POLICY IF EXISTS "users_update_own_bookings" ON public."Booking";
CREATE POLICY "users_update_own_bookings"
ON public."Booking"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin full access to bookings
DROP POLICY IF EXISTS "admin_full_access_bookings" ON public."Booking";
CREATE POLICY "admin_full_access_bookings"
ON public."Booking"
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 7. Payment RLS policies
-- Users can read payments for their own bookings
DROP POLICY IF EXISTS "users_read_own_payments" ON public."Payment";
CREATE POLICY "users_read_own_payments"
ON public."Payment"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Booking" b
    WHERE b.id = "Payment"."bookingId"
    AND b.user_id = auth.uid()
  )
);

-- Admin full access to payments
DROP POLICY IF EXISTS "admin_full_access_payments" ON public."Payment";
CREATE POLICY "admin_full_access_payments"
ON public."Payment"
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 8. Customer RLS policies
-- Users can read their own customer record
DROP POLICY IF EXISTS "users_read_own_customer" ON public."Customer";
CREATE POLICY "users_read_own_customer"
ON public."Customer"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Booking" b
    WHERE b."customerId" = "Customer".id
    AND b.user_id = auth.uid()
  )
);

-- Admin full access to customers
DROP POLICY IF EXISTS "admin_full_access_customers" ON public."Customer";
CREATE POLICY "admin_full_access_customers"
ON public."Customer"
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());
