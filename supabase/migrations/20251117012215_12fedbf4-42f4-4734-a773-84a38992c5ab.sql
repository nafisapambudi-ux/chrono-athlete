-- Add INSERT policy to profiles table to allow users to create their own profile during signup
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);