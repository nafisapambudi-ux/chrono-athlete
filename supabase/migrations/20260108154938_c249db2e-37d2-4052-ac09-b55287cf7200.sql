-- Allow coaches to insert athlete roles for other users
DROP POLICY IF EXISTS "Coaches can insert athlete roles" ON public.user_roles;
CREATE POLICY "Coaches can insert athlete roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
);