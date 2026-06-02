-- ============================================================
-- 003_storage.sql — Private storage buckets and policies
-- Run AFTER 002_rls.sql
-- ============================================================

-- Create private buckets (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('chat-images', 'chat-images', false, 10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('chat-videos', 'chat-videos', false, 52428800, -- 50 MB
    ARRAY['video/mp4', 'video/webm']),
  ('chat-audio', 'chat-audio', false, 5242880, -- 5 MB
    ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage policies for chat-images
-- ============================================================
CREATE POLICY "Allowed users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allowed users can read images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage policies for chat-videos
-- ============================================================
CREATE POLICY "Allowed users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-videos'
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allowed users can read videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-videos'
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
  );

CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage policies for chat-audio
-- ============================================================
CREATE POLICY "Allowed users can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-audio'
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allowed users can read audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
  );

CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
