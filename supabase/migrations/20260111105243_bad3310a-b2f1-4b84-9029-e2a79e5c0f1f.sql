-- Add policy to allow all authenticated users to view lecturer profiles
-- This enables students to see the list of lecturers when creating a project

CREATE POLICY "Anyone can view lecturer profiles"
ON public.profiles
FOR SELECT
USING (role = 'lecturer');