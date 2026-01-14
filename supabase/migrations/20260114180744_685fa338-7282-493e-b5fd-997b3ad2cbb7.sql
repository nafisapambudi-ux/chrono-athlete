-- Add gender and birth_date columns to athletes table
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create athlete_tests table for storing test results
CREATE TABLE public.athlete_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_category TEXT NOT NULL CHECK (test_category IN ('strength', 'speed', 'endurance', 'flexibility', 'power', 'agility')),
  test_name TEXT NOT NULL,
  result_value NUMERIC NOT NULL,
  result_unit TEXT NOT NULL,
  body_weight_at_test NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.athlete_tests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for athlete_tests
CREATE POLICY "Coaches can view tests of their athletes"
ON public.athlete_tests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_tests.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can view their own tests"
ON public.athlete_tests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_tests.athlete_id
    AND athletes.linked_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert tests for their athletes"
ON public.athlete_tests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_tests.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update tests of their athletes"
ON public.athlete_tests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_tests.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete tests of their athletes"
ON public.athlete_tests FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_tests.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_athlete_tests_updated_at
BEFORE UPDATE ON public.athlete_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();