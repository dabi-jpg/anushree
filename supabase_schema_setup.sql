-- ============================================================================
-- SUPABASE CONSOLIDATED SCHEMA SETUP SCRIPT
-- ============================================================================
-- RUN THIS ENTIRE SCRIPT IN THE SUPABASE SQL EDITOR (https://supabase.com/dashboard)
-- Select your project, open SQL Editor, paste this script, and click "Run".
-- ============================================================================

-- ------------------------------------------------------------
-- Part 1: Schema Definitions
-- ------------------------------------------------------------

-- Immutable email allowlist (the core access control)
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email TEXT PRIMARY KEY CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

INSERT INTO public.allowed_emails (email) VALUES
  ('niranjangnair81@gmail.com'),
  ('anushree31suresh@gmail.com')
ON CONFLICT DO NOTHING;

-- Revoke all modifications on allowlist from public/authenticated roles
REVOKE ALL ON public.allowed_emails FROM public, anon, authenticated;
GRANT SELECT ON public.allowed_emails TO authenticated;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away'))
);

-- Conversations (single shared conversation)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Members
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conv ON public.conversation_members(conversation_id);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT, -- stores encrypted ciphertext
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  checksum TEXT -- SHA-256 integrity hash
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_attachments_message ON public.attachments(message_id);

-- Read Receipts
CREATE TABLE IF NOT EXISTS public.read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON public.read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON public.read_receipts(user_id);

-- Audit Events (security log — insert-only)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON public.audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON public.audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON public.audit_events(created_at DESC);

-- Enable realtime for messages, receipts, profiles table
-- (Checks to make sure it doesn't fail if already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'read_receipts'
  ) then
    alter publication supabase_realtime add table public.read_receipts;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;


-- ------------------------------------------------------------
-- Part 2: Row Level Security (RLS) policies
-- ------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Authenticated users can read allowlist" ON public.allowed_emails;
DROP POLICY IF EXISTS "Users can read allowed profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Members can read conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can edit own messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Members can read attachments" ON public.attachments;
DROP POLICY IF EXISTS "Sender can add attachments" ON public.attachments;
DROP POLICY IF EXISTS "Members can read receipts" ON public.read_receipts;
DROP POLICY IF EXISTS "Members can mark messages read" ON public.read_receipts;
DROP POLICY IF EXISTS "Authenticated users can insert audit events" ON public.audit_events;

-- allowed_emails
CREATE POLICY "Authenticated users can read allowlist"
  ON public.allowed_emails FOR SELECT
  TO authenticated
  USING (true);

-- profiles
CREATE POLICY "Users can read allowed profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND email = (SELECT auth.jwt() ->> 'email')
    AND email IN (SELECT email FROM public.allowed_emails)
  );

-- conversations
CREATE POLICY "Members can read conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM public.conversation_members
      WHERE user_id = auth.uid()
    )
  );

-- conversation_members
CREATE POLICY "Members can read conversation members"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

-- messages
CREATE POLICY "Members can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM public.conversation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sender can edit own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Sender can delete own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- attachments
CREATE POLICY "Members can read attachments"
  ON public.attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Sender can add attachments"
  ON public.attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    message_id IN (
      SELECT m.id FROM public.messages m
      WHERE m.sender_id = auth.uid()
    )
  );

-- read_receipts
CREATE POLICY "Members can read receipts"
  ON public.read_receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can mark messages read"
  ON public.read_receipts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

-- audit_events
CREATE POLICY "Authenticated users can insert audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());


-- ------------------------------------------------------------
-- Part 3: Storage Buckets and Policies
-- ------------------------------------------------------------

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

-- Storage policies clean recreation
DROP POLICY IF EXISTS "Allowed users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allowed users can read images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Allowed users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Allowed users can read videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
DROP POLICY IF EXISTS "Allowed users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Allowed users can read audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;

-- chat-images
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

-- chat-videos
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

-- chat-audio
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


-- ------------------------------------------------------------
-- Part 4: Database Functions and Triggers
-- ------------------------------------------------------------

-- Display name helper
CREATE OR REPLACE FUNCTION public.get_display_name(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE user_email
    WHEN 'niranjangnair81@gmail.com' THEN RETURN 'Niranjan';
    WHEN 'anushree31suresh@gmail.com' THEN RETURN 'Anushree';
    ELSE RETURN 'Unknown';
  END CASE;
END;
$$;

-- Seed the single conversation
CREATE OR REPLACE FUNCTION public.seed_conversation()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT id INTO conv_id FROM public.conversations LIMIT 1;
  
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$;

-- Run seeding function
SELECT public.seed_conversation();

-- Handle new user signup trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
  user_display_name TEXT;
BEGIN
  -- Verify email is in allowlist
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'Email not in allowlist: %', NEW.email;
  END IF;

  -- Get display name
  user_display_name := public.get_display_name(NEW.email);

  -- Create profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, user_display_name)
  ON CONFLICT (id) DO NOTHING;

  -- Add to the single conversation
  SELECT id INTO conv_id FROM public.conversations LIMIT 1;
  
  IF conv_id IS NOT NULL THEN
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (conv_id, NEW.id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  -- Log the signup event
  INSERT INTO public.audit_events (actor_id, event_type, metadata)
  VALUES (NEW.id, 'user_signup', jsonb_build_object('email_hash', md5(NEW.email)));

  RETURN NEW;
END;
$$;

-- Trigger configuration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update last_seen
CREATE OR REPLACE FUNCTION public.update_last_seen(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = NOW(), status = 'online'
  WHERE id = p_user_id;
END;
$$;

-- Mark messages as read in bulk
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is a member of this conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this conversation';
  END IF;

  -- Insert read receipts for all unread messages from the OTHER user
  INSERT INTO public.read_receipts (message_id, user_id)
  SELECT m.id, p_user_id
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND m.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.read_receipts rr
      WHERE rr.message_id = m.id AND rr.user_id = p_user_id
    )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$;

-- Log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id UUID,
  p_event_type TEXT,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_events (actor_id, event_type, ip_hash, user_agent_hash, metadata)
  VALUES (p_actor_id, p_event_type, p_ip_hash, p_user_agent_hash, p_metadata);
END;
$$;

-- Auto-update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message_update_conversation ON public.messages;
CREATE TRIGGER on_new_message_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- ============================================================
-- Ensure user profile and conversation member row exist
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_profile_and_conversation(
  p_user_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
  user_display_name TEXT;
  profile_row RECORD;
  member_row RECORD;
BEGIN
  -- Verify email is in allowlist
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email not in allowlist: %', p_email;
  END IF;

  -- Ensure we have a conversation created
  SELECT id INTO conv_id FROM public.conversations LIMIT 1;
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES
    RETURNING id INTO conv_id;
  END IF;

  -- Get display name
  user_display_name := public.get_display_name(p_email);

  -- Create profile if missing
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (p_user_id, p_email, user_display_name)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, display_name = COALESCE(profiles.display_name, EXCLUDED.display_name)
  RETURNING * INTO profile_row;

  -- Add to the conversation if missing
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (conv_id, p_user_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING
  RETURNING * INTO member_row;

  RETURN jsonb_build_object(
    'profile', to_jsonb(profile_row),
    'conversation_id', conv_id
  );
END;
$$;
