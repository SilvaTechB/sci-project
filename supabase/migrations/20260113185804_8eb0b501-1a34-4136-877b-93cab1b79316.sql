-- Add deadline field to projects table
ALTER TABLE public.projects ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;

-- Create project_comments table for discussion threads
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Students can view comments on their own projects
CREATE POLICY "Students can view comments on their projects"
ON public.project_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.student_id = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Lecturers can view comments on projects assigned to them
CREATE POLICY "Lecturers can view comments on assigned projects"
ON public.project_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.assigned_lecturer_id = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Users can insert comments on projects they have access to (student or assigned lecturer)
CREATE POLICY "Users can add comments to accessible projects"
ON public.project_comments
FOR INSERT
WITH CHECK (
  author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id AND (
        p.student_id = author_id OR p.assigned_lecturer_id = author_id
      )
    )
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.project_comments
FOR UPDATE
USING (
  author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.project_comments
FOR DELETE
USING (
  author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_project_comments_updated_at
BEFORE UPDATE ON public.project_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_author_id ON public.project_comments(author_id);