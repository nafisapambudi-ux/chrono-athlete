-- Create training_programs table for coach-created training plans
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  program_date DATE NOT NULL,
  program_type TEXT NOT NULL DEFAULT 'training', -- training, rest, recovery
  warm_up TEXT,
  cooling_down TEXT,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_rpe INTEGER,
  completed_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, program_date)
);

-- Create program_exercises table for exercises within a program
CREATE TABLE public.program_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT NOT NULL DEFAULT 'strength', -- strength, speed, endurance, technique, tactical
  sets INTEGER,
  reps INTEGER,
  load_value TEXT, -- can be kg, distance, time etc
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_programs
CREATE POLICY "Users can view programs for own athletes" 
ON public.training_programs 
FOR SELECT 
USING (EXISTS ( SELECT 1 FROM athletes WHERE athletes.id = training_programs.athlete_id AND athletes.user_id = auth.uid() ));

CREATE POLICY "Users can insert programs for own athletes" 
ON public.training_programs 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1 FROM athletes WHERE athletes.id = training_programs.athlete_id AND athletes.user_id = auth.uid() ));

CREATE POLICY "Users can update programs for own athletes" 
ON public.training_programs 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM athletes WHERE athletes.id = training_programs.athlete_id AND athletes.user_id = auth.uid() ));

CREATE POLICY "Users can delete programs for own athletes" 
ON public.training_programs 
FOR DELETE 
USING (EXISTS ( SELECT 1 FROM athletes WHERE athletes.id = training_programs.athlete_id AND athletes.user_id = auth.uid() ));

-- RLS policies for program_exercises
CREATE POLICY "Users can view exercises for own programs" 
ON public.program_exercises 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM training_programs tp 
  JOIN athletes a ON a.id = tp.athlete_id 
  WHERE tp.id = program_exercises.program_id AND a.user_id = auth.uid() 
));

CREATE POLICY "Users can insert exercises for own programs" 
ON public.program_exercises 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM training_programs tp 
  JOIN athletes a ON a.id = tp.athlete_id 
  WHERE tp.id = program_exercises.program_id AND a.user_id = auth.uid() 
));

CREATE POLICY "Users can update exercises for own programs" 
ON public.program_exercises 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 FROM training_programs tp 
  JOIN athletes a ON a.id = tp.athlete_id 
  WHERE tp.id = program_exercises.program_id AND a.user_id = auth.uid() 
));

CREATE POLICY "Users can delete exercises for own programs" 
ON public.program_exercises 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM training_programs tp 
  JOIN athletes a ON a.id = tp.athlete_id 
  WHERE tp.id = program_exercises.program_id AND a.user_id = auth.uid() 
));

-- Trigger for updated_at
CREATE TRIGGER update_training_programs_updated_at
BEFORE UPDATE ON public.training_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();