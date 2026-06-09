-- Migration: Create Storage Bucket for Documents

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('exit-documents', 'exit-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exit-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read documents in their folder, managers can read all
CREATE POLICY "Users can view own documents, managers can view all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exit-documents' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'hr', 'admin'))
  )
);
