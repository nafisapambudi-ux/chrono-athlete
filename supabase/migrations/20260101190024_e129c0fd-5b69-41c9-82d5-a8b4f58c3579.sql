-- Add sports_branch column to athletes table
ALTER TABLE public.athletes 
ADD COLUMN sports_branch text;

-- Add a comment for documentation
COMMENT ON COLUMN public.athletes.sports_branch IS 'Cabang olahraga atlet';