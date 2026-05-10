-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING HUB - ADVANCED TASK SYSTEM UPGRADE
-- ═══════════════════════════════════════════════════════

-- 1. Enhance Task Settings with VIP Parameters
ALTER TABLE task_settings 
ADD COLUMN IF NOT EXISTS level_name TEXT,
ADD COLUMN IF NOT EXISTS min_access_balance NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS fixed_commission NUMERIC DEFAULT 0;

-- Update existing levels with the new requirements
UPDATE task_settings SET 
  level_name = 'VIP 1 - Shopify',
  min_access_balance = 20,
  total_orders = 20,
  fixed_commission = 6
WHERE vip_level = 1;

UPDATE task_settings SET 
  level_name = 'VIP 2 - Shopify',
  min_access_balance = 20,
  total_orders = 18,
  fixed_commission = 23
WHERE vip_level = 2;

UPDATE task_settings SET 
  level_name = 'VIP 3 - Shopify',
  min_access_balance = 20,
  total_orders = 16,
  fixed_commission = 400
WHERE vip_level = 3;

-- 2. Enhance Users Table with Admin Controls
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_task_locked BOOLEAN DEFAULT FALSE;

-- 3. Add Session Commission Tracker to Users
-- This helps track how much commission is earned in the CURRENT session
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_session_commission NUMERIC DEFAULT 0;
