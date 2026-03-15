-- ============================================================
-- SCI Archive: Admin role + Group projects + Contributions
-- ============================================================

-- 1. Extend user_role enum to include 'admin'
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Add project_type and contribution_type enums
DO $$ BEGIN
  CREATE TYPE public.project_type AS ENUM ('individual', 'group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contribution_type AS ENUM ('individual', 'peer', 'group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add new columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type public.project_type NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS contribution_type public.contribution_type NOT NULL DEFAULT 'individual';

-- 4. Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_members_project ON public.group_members(project_id);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for group_members
-- Students can view their own project's group members
CREATE POLICY "Students can view group members for their projects"
  ON public.group_members FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Students can manage group members for their own pending projects
CREATE POLICY "Students can insert group members for their projects"
  ON public.group_members FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND status = 'pending'
    )
  );

CREATE POLICY "Students can delete group members for their projects"
  ON public.group_members FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND status = 'pending'
    )
  );

-- Lecturers and admins can view all group members
CREATE POLICY "Lecturers and admins can view all group members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('lecturer', 'admin')
    )
  );

-- 6. Admin RLS policies on profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Admin RLS policies on projects
CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all projects"
  ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Admin RLS policies on project_documents
CREATE POLICY "Admins can view all documents"
  ON public.project_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete documents"
  ON public.project_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Admin RLS on group_members
CREATE POLICY "Admins can manage all group members"
  ON public.group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
