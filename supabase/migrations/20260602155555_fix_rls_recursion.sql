-- ============================================================
-- Fix RLS Recursion and Simplify Policies
-- ============================================================

-- 1. Helper function to check conversation membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
END;
$$;

-- 2. Drop and recreate conversation_members SELECT policy
DROP POLICY IF EXISTS "Members can read conversation members" ON public.conversation_members;
CREATE POLICY "Members can read conversation members"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid())
  );

-- 3. Drop and recreate conversations SELECT policy
DROP POLICY IF EXISTS "Members can read conversations" ON public.conversations;
CREATE POLICY "Members can read conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_member(id, auth.uid())
  );

-- 4. Drop and recreate messages SELECT policy
DROP POLICY IF EXISTS "Members can read messages" ON public.messages;
CREATE POLICY "Members can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
CREATE POLICY "Members can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(conversation_id, auth.uid())
  );

-- 5. Drop and recreate profiles SELECT policy (remove redundant JWT email check)
DROP POLICY IF EXISTS "Users can read allowed profiles" ON public.profiles;
CREATE POLICY "Users can read allowed profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    email IN (SELECT email FROM public.allowed_emails)
  );
