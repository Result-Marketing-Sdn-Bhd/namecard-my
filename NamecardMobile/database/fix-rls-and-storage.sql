-- ================================================================
-- FIX RLS POLICIES AND STORAGE BUCKET FOR WHATSCARD
-- Run this script in Supabase SQL Editor
-- ================================================================

-- 1. DROP EXISTING RLS POLICIES (to avoid conflicts)
-- ================================================================

DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

-- 2. CREATE PROPER RLS POLICIES FOR CONTACTS TABLE
-- ================================================================

-- Allow users to INSERT their own contacts
CREATE POLICY "Users can insert their own contacts"
ON contacts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to SELECT their own contacts
CREATE POLICY "Users can view their own contacts"
ON contacts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to UPDATE their own contacts
CREATE POLICY "Users can update their own contacts"
ON contacts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own contacts
CREATE POLICY "Users can delete their own contacts"
ON contacts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. ENSURE RLS IS ENABLED ON CONTACTS TABLE
-- ================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 4. CREATE STORAGE BUCKET FOR CONTACT IMAGES
-- ================================================================

-- Check if bucket exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'contact-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'contact-images',
      'contact-images',
      false,  -- Private bucket (users can only access their own images)
      5242880,  -- 5MB file size limit
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp']
    );
  END IF;
END $$;

-- 5. CREATE RLS POLICIES FOR STORAGE BUCKET
-- ================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own contact images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own contact images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own contact images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own contact images" ON storage.objects;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own contact images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contact-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own images
CREATE POLICY "Users can view their own contact images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contact-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own contact images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contact-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own contact images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contact-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. VERIFY SETUP
-- ================================================================

-- Check RLS policies on contacts table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contacts'
ORDER BY policyname;

-- Check storage bucket exists
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'contact-images';

-- Check storage policies
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%contact%'
ORDER BY policyname;

-- ================================================================
-- SCRIPT COMPLETE
-- All RLS policies and storage bucket should now be properly configured!
-- ================================================================
