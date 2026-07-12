-- Add additional gallery images and variations support to the products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '{"attributes": [], "variants": []}'::jsonb;
