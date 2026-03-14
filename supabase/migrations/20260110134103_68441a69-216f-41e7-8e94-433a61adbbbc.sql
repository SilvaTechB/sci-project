-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'lecturer');

-- Create enum for submission status
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table for extended user info
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  registration_number TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  course_name TEXT,
  year_of_study INTEGER,
  can_submit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table for student submissions
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status submission_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_documents table for uploaded files
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lecturers can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'lecturer'
  )
);

-- Projects policies
CREATE POLICY "Students can view their own projects" 
ON public.projects 
FOR SELECT 
USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Students can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND can_submit = true)
);

CREATE POLICY "Students can update their pending projects" 
ON public.projects 
FOR UPDATE 
USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) 
  AND status = 'pending'
);

CREATE POLICY "Lecturers can view all projects"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'lecturer'
  )
);

CREATE POLICY "Lecturers can update projects for review"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'lecturer'
  )
);

-- Project documents policies
CREATE POLICY "Students can view their own project documents" 
ON public.project_documents 
FOR SELECT 
USING (
  project_id IN (
    SELECT pr.id FROM public.projects pr
    JOIN public.profiles p ON pr.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Students can upload documents to their projects" 
ON public.project_documents 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT pr.id FROM public.projects pr
    JOIN public.profiles p ON pr.student_id = p.id
    WHERE p.user_id = auth.uid() AND pr.status = 'pending'
  )
);

CREATE POLICY "Lecturers can view all project documents"
ON public.project_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'lecturer'
  )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Storage policies
CREATE POLICY "Students can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lecturers can view all documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'lecturer'
  )
);
