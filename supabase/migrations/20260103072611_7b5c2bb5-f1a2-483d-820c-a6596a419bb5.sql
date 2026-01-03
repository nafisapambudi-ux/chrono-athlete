
-- Add linked_user_id to athletes for athlete users to see their own profile
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_athletes_linked_user_id ON public.athletes(linked_user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own athletes" ON public.athletes;
DROP POLICY IF EXISTS "Users can insert own athletes" ON public.athletes;
DROP POLICY IF EXISTS "Users can update own athletes" ON public.athletes;
DROP POLICY IF EXISTS "Users can delete own athletes" ON public.athletes;

-- New RLS policies for athletes table
-- Coaches can view athletes they created
CREATE POLICY "Coaches can view own athletes" 
ON public.athletes FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'coach') AND auth.uid() = user_id)
  OR (public.has_role(auth.uid(), 'owner') AND auth.uid() = user_id)
);

-- Athletes can view their own linked profile
CREATE POLICY "Athletes can view linked profile" 
ON public.athletes FOR SELECT 
USING (
  public.has_role(auth.uid(), 'athlete') AND linked_user_id = auth.uid()
);

-- Coaches/owners can insert athletes
CREATE POLICY "Coaches can insert athletes" 
ON public.athletes FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'owner'))
);

-- Coaches/owners can update their athletes
CREATE POLICY "Coaches can update own athletes" 
ON public.athletes FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'owner'))
);

-- Coaches/owners can delete their athletes
CREATE POLICY "Coaches can delete own athletes" 
ON public.athletes FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'owner'))
);

-- Update training_programs policies for athlete access
DROP POLICY IF EXISTS "Users can view programs for own athletes" ON public.training_programs;

CREATE POLICY "Coaches can view programs" 
ON public.training_programs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = training_programs.athlete_id 
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can view own programs" 
ON public.training_programs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = training_programs.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Athletes can update their programs (to complete them)
CREATE POLICY "Athletes can complete own programs" 
ON public.training_programs FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = training_programs.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Update program_exercises policies for athlete access
DROP POLICY IF EXISTS "Users can view exercises for own programs" ON public.program_exercises;

CREATE POLICY "Coaches can view exercises" 
ON public.program_exercises FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM training_programs tp
    JOIN athletes a ON a.id = tp.athlete_id
    WHERE tp.id = program_exercises.program_id 
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can view own exercises" 
ON public.program_exercises FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM training_programs tp
    JOIN athletes a ON a.id = tp.athlete_id
    WHERE tp.id = program_exercises.program_id 
    AND a.linked_user_id = auth.uid()
  )
);

-- Update athlete_readiness policies
DROP POLICY IF EXISTS "Users can view readiness for own athletes" ON public.athlete_readiness;

CREATE POLICY "Coaches can view readiness" 
ON public.athlete_readiness FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = athlete_readiness.athlete_id 
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can view own readiness" 
ON public.athlete_readiness FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = athlete_readiness.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Athletes can insert their own readiness data
CREATE POLICY "Athletes can insert own readiness" 
ON public.athlete_readiness FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = athlete_readiness.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Update training_sessions policies
DROP POLICY IF EXISTS "Users can view sessions for own athletes" ON public.training_sessions;

CREATE POLICY "Coaches can view sessions" 
ON public.training_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = training_sessions.athlete_id 
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can view own sessions" 
ON public.training_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM athletes 
    WHERE athletes.id = training_sessions.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);
