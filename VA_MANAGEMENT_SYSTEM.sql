-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING MARKET - VA MANAGEMENT SYSTEM
-- ═══════════════════════════════════════════════════════

-- 1. VA Accounts Table
CREATE TABLE IF NOT EXISTS va_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VA Permissions Table
CREATE TABLE IF NOT EXISTS va_permissions (
    va_id UUID PRIMARY KEY REFERENCES va_accounts(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_reset_tasks BOOLEAN DEFAULT FALSE,
    can_approve_requests BOOLEAN DEFAULT FALSE,
    can_approve_finance BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VA Sessions Table
CREATE TABLE IF NOT EXISTS va_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    va_id UUID REFERENCES va_accounts(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VA Activity Logs
CREATE TABLE IF NOT EXISTS va_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    va_id UUID REFERENCES va_accounts(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trigger to auto-create permissions row
CREATE OR REPLACE FUNCTION handle_new_va() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO va_permissions (va_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_va_created
    AFTER INSERT ON va_accounts
    FOR EACH ROW EXECUTE FUNCTION handle_new_va();

-- 6. Enable Realtime for VA tables
ALTER PUBLICATION supabase_realtime ADD TABLE va_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE va_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE va_sessions;
