-- Fix all RLS policies to be PERMISSIVE and add lecturer assignment feature

-- Add assigned_lecturer_id column to projects table for lecturer selection
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_lecturer_id uuid REFERENCES profiles(id);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- PROFILES TABLE
DROP POLICY IF EXISTS "Lecturers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Lecturers can view all profiles" ON profiles FOR SELECT USING (is_lecturer(auth.uid()));
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- PROJECT_DOCUMENTS TABLE
DROP POLICY IF EXISTS "Lecturers can view all project documents" ON project_documents;
DROP POLICY IF EXISTS "Students can upload documents to their projects" ON project_documents;
DROP POLICY IF EXISTS "Students can view their own project documents" ON project_documents;

CREATE POLICY "Students can view their own project documents" ON project_documents FOR SELECT 
USING (project_id IN (SELECT id FROM projects WHERE student_id = get_profile_id(auth.uid())));

CREATE POLICY "Lecturers can view all project documents" ON project_documents FOR SELECT 
USING (is_lecturer(auth.uid()));

CREATE POLICY "Students can upload documents to their projects" ON project_documents FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM projects WHERE student_id = get_profile_id(auth.uid()) AND status = 'pending'));

CREATE POLICY "Students can delete their own documents" ON project_documents FOR DELETE 
USING (project_id IN (SELECT id FROM projects WHERE student_id = get_profile_id(auth.uid()) AND status = 'pending'));

-- PROJECTS TABLE
DROP POLICY IF EXISTS "Lecturers can update projects for review" ON projects;
DROP POLICY IF EXISTS "Lecturers can view all projects" ON projects;
DROP POLICY IF EXISTS "Students can create their own projects" ON projects;
DROP POLICY IF EXISTS "Students can update their pending projects" ON projects;
DROP POLICY IF EXISTS "Students can view their own projects" ON projects;

CREATE POLICY "Students can view their own projects" ON projects FOR SELECT 
USING (student_id = get_profile_id(auth.uid()));

CREATE POLICY "Lecturers can view all projects" ON projects FOR SELECT 
USING (is_lecturer(auth.uid()));

CREATE POLICY "Assigned lecturers can view their projects" ON projects FOR SELECT 
USING (assigned_lecturer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can create their own projects" ON projects FOR INSERT 
WITH CHECK (student_id = get_profile_id(auth.uid()) AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND can_submit = true));

CREATE POLICY "Students can update their pending projects" ON projects FOR UPDATE 
USING (student_id = get_profile_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Lecturers can update projects for review" ON projects FOR UPDATE 
USING (is_lecturer(auth.uid()));

CREATE POLICY "Students can delete their pending projects" ON projects FOR DELETE 
USING (student_id = get_profile_id(auth.uid()) AND status = 'pending');