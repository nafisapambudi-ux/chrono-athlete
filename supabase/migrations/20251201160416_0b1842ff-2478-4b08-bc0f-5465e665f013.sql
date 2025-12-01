-- Add avatar_url column to athletes table
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;