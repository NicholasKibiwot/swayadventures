-- Partner Hotels Migration
-- Creates partner_hotels table for managing hotels displayed on the homepage

CREATE TABLE IF NOT EXISTS public.partner_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  stars INTEGER NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  price_from NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_hotels_is_active ON public.partner_hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_hotels_created_at ON public.partner_hotels(created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_partner_hotels_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_partner_hotels_updated_at ON public.partner_hotels;
CREATE TRIGGER set_partner_hotels_updated_at
  BEFORE UPDATE ON public.partner_hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_partner_hotels_updated_at();

-- Enable RLS
ALTER TABLE public.partner_hotels ENABLE ROW LEVEL SECURITY;

-- Public can read active hotels
DROP POLICY IF EXISTS "public_read_partner_hotels" ON public.partner_hotels;
CREATE POLICY "public_read_partner_hotels"
ON public.partner_hotels
FOR SELECT
TO public
USING (is_active = true);

-- Admins can read all (including hidden)
DROP POLICY IF EXISTS "admin_read_all_partner_hotels" ON public.partner_hotels;
CREATE POLICY "admin_read_all_partner_hotels"
ON public.partner_hotels
FOR SELECT
TO authenticated
USING (public.is_admin_from_auth());

-- Admins can insert
DROP POLICY IF EXISTS "admin_insert_partner_hotels" ON public.partner_hotels;
CREATE POLICY "admin_insert_partner_hotels"
ON public.partner_hotels
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_from_auth());

-- Admins can update
DROP POLICY IF EXISTS "admin_update_partner_hotels" ON public.partner_hotels;
CREATE POLICY "admin_update_partner_hotels"
ON public.partner_hotels
FOR UPDATE
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Admins can delete
DROP POLICY IF EXISTS "admin_delete_partner_hotels" ON public.partner_hotels;
CREATE POLICY "admin_delete_partner_hotels"
ON public.partner_hotels
FOR DELETE
TO authenticated
USING (public.is_admin_from_auth());

-- Seed existing hotels from the static component
INSERT INTO public.partner_hotels (name, location, description, stars, price_from, image_url, image_alt, is_active)
VALUES
  (
    'Sarova Stanley',
    'Nairobi CBD',
    'Nairobi''s iconic heritage hotel blending colonial elegance with modern luxury in the heart of the city.',
    5, 180,
    '/assets/images/hotel-sarova-stanley.png',
    'Grand colonial hotel facade with manicured gardens and warm evening lighting in Nairobi',
    true
  ),
  (
    'Hemingways Watamu',
    'Watamu, Coast',
    'Award-winning beachfront resort offering world-class fishing, diving, and Indian Ocean views.',
    5, 320,
    '/assets/images/hotel-hemingways-watamu.png',
    'Luxury beachfront resort with infinity pool overlooking turquoise Indian Ocean at sunset',
    true
  ),
  (
    'Angama Mara',
    'Maasai Mara',
    'Breathtaking tented camp perched on the Great Rift Valley escarpment above the Maasai Mara.',
    5, 890,
    '/assets/images/hotel-angama-mara.png',
    'Luxury tented camp on escarpment edge overlooking vast Mara plains at golden hour',
    true
  ),
  (
    'Giraffe Manor',
    'Karen, Nairobi',
    'The world''s most Instagrammed hotel — a boutique manor where resident Rothschild giraffes join guests for breakfast.',
    5, 650,
    '/assets/images/hotel-giraffe-manor.jpg',
    'Elegant manor house surrounded by lush tropical gardens with giraffe head visible through window',
    true
  )
ON CONFLICT DO NOTHING;
