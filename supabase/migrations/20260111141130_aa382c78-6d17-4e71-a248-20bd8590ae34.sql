-- Allow uploads + reads for private bucket 'project-documents'

-- Upload (INSERT)
CREATE POLICY "Users can upload own project documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read (SELECT) for owners + lecturers
CREATE POLICY "Users can read project documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_lecturer(auth.uid())
  )
);

-- Delete (DELETE) for owners only
CREATE POLICY "Users can delete own project documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
