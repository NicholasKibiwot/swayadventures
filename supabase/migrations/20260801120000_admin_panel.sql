-- Admin Panel Migration
-- Creates user_profiles table, admin role support, and admin RLS policies

-- 1. Create user_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 2. Function to check admin role from auth metadata (safe, no recursion)
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_user_meta_data->>'role' = 'admin'
      OR au.raw_app_meta_data->>'role' = 'admin'
    )
  )
$$;

-- 3. Trigger to auto-create user_profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 5. Trip table - public read, admin write
ALTER TABLE public."Trip" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_trip" ON public."Trip";
CREATE POLICY "public_read_trip"
ON public."Trip"
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_trip" ON public."Trip";
CREATE POLICY "admin_manage_trip"
ON public."Trip"
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 6. TripImage table - public read, admin write
ALTER TABLE public."TripImage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_trip_image" ON public."TripImage";
CREATE POLICY "public_read_trip_image"
ON public."TripImage"
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_trip_image" ON public."TripImage";
CREATE POLICY "admin_manage_trip_image"
ON public."TripImage"
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 7. Destination table - public read, admin write
ALTER TABLE public."Destination" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_destination" ON public."Destination";
CREATE POLICY "public_read_destination"
ON public."Destination"
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_destination" ON public."Destination";
CREATE POLICY "admin_manage_destination"
ON public."Destination"
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 8. Storage bucket policies for trip images
-- Allow public read on the existing bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_trip_images_storage" ON storage.objects;
CREATE POLICY "public_read_trip_images_storage"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'trip-images');

DROP POLICY IF EXISTS "admin_upload_trip_images" ON storage.objects;
CREATE POLICY "admin_upload_trip_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trip-images' AND public.is_admin_from_auth());

DROP POLICY IF EXISTS "admin_update_trip_images" ON storage.objects;
CREATE POLICY "admin_update_trip_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'trip-images' AND public.is_admin_from_auth())
WITH CHECK (bucket_id = 'trip-images' AND public.is_admin_from_auth());

DROP POLICY IF EXISTS "admin_delete_trip_images" ON storage.objects;
CREATE POLICY "admin_delete_trip_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'trip-images' AND public.is_admin_from_auth());

-- 9. Seed admin user
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    admin_uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@swayadventures.com',
    crypt('SwayAdmin2026!', gen_salt('bf', 10)),
    now(), now(), now(),
    jsonb_build_object('full_name', 'Sway Admin', 'role', 'admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  )
  ON CONFLICT (email) DO UPDATE SET
    raw_user_meta_data = jsonb_build_object('full_name', 'Sway Admin', 'role', 'admin'),
    raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
    updated_at = now();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin user seed: %', SQLERRM;
END $$;
