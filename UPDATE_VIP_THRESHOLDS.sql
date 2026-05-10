-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING MARKET - DYNAMIC VIP LOCKING SYSTEM
-- ═══════════════════════════════════════════════════════

-- 1. Update VIP Thresholds
UPDATE task_settings 
SET balance_min = 20, balance_max = 398 
WHERE vip_level = 1;

UPDATE task_settings 
SET balance_min = 399, balance_max = 798 
WHERE vip_level = 2;

UPDATE task_settings 
SET balance_min = 799, balance_max = 999999 
WHERE vip_level = 3;

-- 2. Ensure all existing users are aware of the new rules
-- (Optional: you can also force update user vip_level based on balance, 
-- but the frontend will now handle the lock visualization dynamically)
