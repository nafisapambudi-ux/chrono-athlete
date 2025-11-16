-- Create athlete readiness table
CREATE TABLE public.athlete_readiness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  readiness_date DATE NOT NULL,
  resting_heart_rate INTEGER NOT NULL,
  vertical_jump NUMERIC NOT NULL,
  readiness_score NUMERIC,
  vo2max NUMERIC,
  power NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_athlete
    FOREIGN KEY (athlete_id)
    REFERENCES athletes(id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.athlete_readiness ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view readiness for own athletes"
ON public.athlete_readiness
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert readiness for own athletes"
ON public.athlete_readiness
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update readiness for own athletes"
ON public.athlete_readiness
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete readiness for own athletes"
ON public.athlete_readiness
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_athlete_readiness_athlete_id ON public.athlete_readiness(athlete_id);
CREATE INDEX idx_athlete_readiness_date ON public.athlete_readiness(readiness_date);