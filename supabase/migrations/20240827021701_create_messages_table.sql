-- Create messages table for JARVIS conversations
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('you', 'jarvis', 'user', 'assistant')),
    text TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated and anonymous users
-- This allows both web app and Telegram bot to access the table
CREATE POLICY "Allow all operations for everyone" ON public.messages
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.messages TO anon;
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON SEQUENCE messages_id_seq TO anon;
GRANT USAGE ON SEQUENCE messages_id_seq TO authenticated;

