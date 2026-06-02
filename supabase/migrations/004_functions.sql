-- ============================================================
-- 004_functions.sql — Database functions and triggers
-- Run AFTER 003_storage.sql
-- ============================================================

-- ============================================================
-- Display name mapping for the two users
-- ============================================================
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

-- ============================================================
-- Seed the single conversation (run once)
-- ============================================================
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

-- Create the conversation immediately
SELECT public.seed_conversation();

-- ============================================================
-- Handle new user signup: create profile + add to conversation
-- ============================================================
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

-- Trigger: auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Update last_seen timestamp
-- ============================================================
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

-- ============================================================
-- Mark messages as read (bulk)
-- ============================================================
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

-- ============================================================
-- Log audit event helper
-- ============================================================
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

-- ============================================================
-- Auto-update conversation.updated_at on new message
-- ============================================================
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
