-- Drop any existing storage policies that might conflict and recreate
DROP POLICY IF EXISTS "Users can upload documents to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Recreate all storage policies for the project-documents bucket

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Students upload to project-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view/download their own documents
CREATE POLICY "Students view own project-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow lecturers to view all documents in the bucket
CREATE POLICY "Lecturers view all project-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND public.is_lecturer(auth.uid())
);

-- Allow users to update their own documents
CREATE POLICY "Students update own project-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Students delete own project-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);