-- Manual Level Approval System Migration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_vip_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vip_level_request INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vip_level_request_status TEXT DEFAULT 'none' CHECK (vip_level_request_status IN ('none', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS vip_level_approved_at TIMESTAMP WITH TIME ZONE;

-- Seed: If a user already has balance and level 1, maybe pre-approve them or let them request.
-- For now, we'll keep it strictly manual as per request.
