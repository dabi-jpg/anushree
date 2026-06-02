-- ============================================================
-- 002_rls.sql — Row Level Security policies
-- Run AFTER 001_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- allowed_emails: read-only for authenticated users
-- ============================================================
CREATE POLICY "Authenticated users can read allowlist"
  ON public.allowed_emails FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- profiles: users can only see/edit their own profile and see the other allowed user
-- ============================================================
CREATE POLICY "Users can read allowed profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    email IN (SELECT email FROM public.allowed_emails)
    AND (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM public.allowed_emails)
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

-- ============================================================
-- conversations: only members can see conversations
-- ============================================================
CREATE POLICY "Members can read conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM public.conversation_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- conversation_members: members can see membership
-- ============================================================
CREATE POLICY "Members can read conversation members"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

-- ============================================================
-- messages: members can read; sender can insert/update/soft-delete
-- ============================================================
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

-- ============================================================
-- attachments: readable by conversation members, insertable by message sender
-- ============================================================
CREATE POLICY "Members can read attachments"
  ON public.attachments FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
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

-- ============================================================
-- read_receipts: conversation members can read and insert
-- ============================================================
CREATE POLICY "Members can read receipts"
  ON public.read_receipts FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can mark messages read"
  ON public.read_receipts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- ============================================================
-- audit_events: insert-only (no read from client)
-- ============================================================
CREATE POLICY "Authenticated users can insert audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- No SELECT policy = client cannot read audit logs (admin-only via dashboard)
