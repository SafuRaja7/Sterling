-- Create support_threads table
CREATE TABLE IF NOT EXISTS support_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status VARCHAR(20) DEFAULT 'open',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_user_count INT DEFAULT 0,
  unread_admin_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES support_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_type VARCHAR(10) CHECK (sender_type IN ('user', 'admin', 'system')),
  message TEXT,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Optional but good practice)
ALTER TABLE support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Simple policies (Admins can do anything, users can see their own)
CREATE POLICY "Users can view their own thread" ON support_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own messages" ON support_messages FOR SELECT USING (
  thread_id IN (SELECT id FROM support_threads WHERE user_id = auth.uid())
);
CREATE POLICY "Admins have full access to threads" ON support_threads FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to messages" ON support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
