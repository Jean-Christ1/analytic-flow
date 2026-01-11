-- ============================================
-- STORAGE BUCKETS SETUP FOR APEX-ML-PLATFORM
-- Run this script in Supabase SQL Editor
-- ============================================

-- 1. Create avatars bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create models bucket for ML model artifacts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'models',
    'models',
    false,
    104857600, -- 100MB limit
    ARRAY['application/octet-stream', 'application/zip', 'application/x-tar', 'application/gzip']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Create datasets bucket for dataset files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'datasets',
    'datasets',
    false,
    524288000, -- 500MB limit
    ARRAY['text/csv', 'application/json', 'application/x-parquet', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Create exports bucket for export files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exports',
    'exports',
    false,
    104857600, -- 100MB limit
    ARRAY['text/csv', 'application/json', 'application/pdf', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload models" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view datasets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own exports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can create exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own exports" ON storage.objects;

-- Avatars bucket policies (public read, authenticated upload)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Models bucket policies (authenticated access)
CREATE POLICY "Authenticated users can view models"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload models"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can manage their own models"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'models'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own models"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'models'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Datasets bucket policies
CREATE POLICY "Authenticated users can view datasets"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'datasets'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload datasets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'datasets'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can manage their own datasets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'datasets'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own datasets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'datasets'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Exports bucket policies
CREATE POLICY "Users can view their own exports"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can create exports"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'exports'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own exports"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- END OF STORAGE SETUP
-- ============================================
