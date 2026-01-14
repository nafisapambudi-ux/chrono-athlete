-- Create a secure function to get user email by user_id
-- This function can only be called by authenticated users
CREATE OR REPLACE FUNCTION public.get_user_email(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Only return email if the caller is a coach/owner who manages an athlete linked to this user
  -- Or if the caller is the user themselves
  IF auth.uid() = user_id_param THEN
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    RETURN user_email;
  END IF;
  
  -- Check if caller is a coach/owner who has an athlete linked to this user
  IF EXISTS (
    SELECT 1 FROM public.athletes 
    WHERE linked_user_id = user_id_param 
    AND user_id = auth.uid()
  ) THEN
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    RETURN user_email;
  END IF;
  
  RETURN NULL;
END;
$$;