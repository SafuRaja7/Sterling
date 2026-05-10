-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING MARKET - VIP TASK SYSTEM OVERHAUL
-- ═══════════════════════════════════════════════════════

-- 1. Add combo_count to task_settings
ALTER TABLE task_settings 
ADD COLUMN IF NOT EXISTS combo_count INTEGER DEFAULT 0;

-- 2. Update VIP 1 Settings (19 orders, $6 fixed commission, 0 auto-combos)
UPDATE task_settings SET 
  total_orders = 19,
  fixed_commission = 6,
  combo_count = 0
WHERE vip_level = 1;

-- 3. Update VIP 2 Settings (18 orders, $23 fixed commission, 2 auto-combos)
UPDATE task_settings SET 
  total_orders = 18,
  fixed_commission = 23,
  combo_count = 2
WHERE vip_level = 2;

-- 4. Update VIP 3 Settings (16 orders, $400 fixed commission, 4 auto-combos)
UPDATE task_settings SET 
  total_orders = 16,
  fixed_commission = 400,
  combo_count = 4
WHERE vip_level = 3;
