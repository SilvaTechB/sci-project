-- Add version tracking to project_documents
ALTER TABLE public.project_documents 
ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN replaced_by UUID REFERENCES public.project_documents(id),
ADD COLUMN replaces UUID REFERENCES public.project_documents(id);

-- Create index for faster version queries
CREATE INDEX idx_project_documents_project_doctype ON public.project_documents(project_id, document_type);
CREATE INDEX idx_project_documents_current ON public.project_documents(project_id, document_type) WHERE is_current = true;

-- Add UPDATE policy for managing versions (mark old as non-current)
CREATE POLICY "Students can update their own document versions"
ON public.project_documents
FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT projects.id FROM projects 
    WHERE projects.student_id = get_profile_id(auth.uid()) 
    AND projects.status = 'pending'::submission_status
  )
);

-- Function to get all versions of a document type for a project
CREATE OR REPLACE FUNCTION public.get_document_versions(p_project_id UUID, p_document_type TEXT)
RETURNS TABLE(
  id UUID,
  document_type TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ,
  version INTEGER,
  is_current BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pd.id,
    pd.document_type,
    pd.file_name,
    pd.file_path,
    pd.file_size,
    pd.uploaded_at,
    pd.version,
    pd.is_current
  FROM project_documents pd
  WHERE pd.project_id = p_project_id 
    AND pd.document_type = p_document_type
  ORDER BY pd.version DESC;
$$;