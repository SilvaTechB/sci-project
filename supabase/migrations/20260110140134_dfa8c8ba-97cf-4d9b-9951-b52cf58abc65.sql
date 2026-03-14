-- Create security definer function to check user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create function to check if user is a lecturer
CREATE OR REPLACE FUNCTION public.is_lecturer(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'lecturer'
  );
$$;

-- Create function to get profile id for a user
CREATE OR REPLACE FUNCTION public.get_profile_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Lecturers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new non-recursive policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Lecturers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_lecturer(auth.uid()));

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix project policies to use security definer functions
DROP POLICY IF EXISTS "Lecturers can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Lecturers can update projects for review" ON public.projects;
DROP POLICY IF EXISTS "Students can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Students can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Students can update their pending projects" ON public.projects;

CREATE POLICY "Students can view their own projects" 
ON public.projects 
FOR SELECT 
USING (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Lecturers can view all projects" 
ON public.projects 
FOR SELECT 
USING (public.is_lecturer(auth.uid()));

CREATE POLICY "Students can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  student_id = public.get_profile_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND can_submit = true
  )
);

CREATE POLICY "Students can update their pending projects" 
ON public.projects 
FOR UPDATE 
USING (
  student_id = public.get_profile_id(auth.uid()) 
  AND status = 'pending'
);

CREATE POLICY "Lecturers can update projects for review" 
ON public.projects 
FOR UPDATE 
USING (public.is_lecturer(auth.uid()));

-- Fix project_documents policies
DROP POLICY IF EXISTS "Lecturers can view all project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Students can view their own project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Students can upload documents to their projects" ON public.project_documents;

CREATE POLICY "Students can view their own project documents" 
ON public.project_documents 
FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE student_id = public.get_profile_id(auth.uid())
  )
);

CREATE POLICY "Lecturers can view all project documents" 
ON public.project_documents 
FOR SELECT 
USING (public.is_lecturer(auth.uid()));

CREATE POLICY "Students can upload documents to their projects" 
ON public.project_documents 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE student_id = public.get_profile_id(auth.uid()) 
    AND status = 'pending'
  )
);