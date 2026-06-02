-- ============================================================
-- 20260602162350_create_call_sessions.sql
-- Create call_sessions table and setup RLS policies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('ringing', 'connected', 'rejected', 'missed', 'ended', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON public.call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_receiver ON public.call_sessions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON public.call_sessions(status);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT policy: caller or receiver can read the call session details
CREATE POLICY "Users can read own call sessions"
  ON public.call_sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
  );

-- INSERT policy: caller can create the call session
CREATE POLICY "Users can insert own call sessions"
  ON public.call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = caller_id
  );

-- UPDATE policy: caller or receiver can update the call session
CREATE POLICY "Users can update own call sessions"
  ON public.call_sessions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = caller_id OR auth.uid() = receiver_id
  );

-- Add call_sessions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
