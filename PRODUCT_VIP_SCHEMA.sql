-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING MARKET - PRODUCT VIP CATEGORIZATION
-- ═══════════════════════════════════════════════════════

-- 1. Add VIP Level and Combo Item flag to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_combo_item BOOLEAN DEFAULT false;

-- 2. Update existing products to be VIP 1 Standard by default
UPDATE products SET vip_level = 1, is_combo_item = false WHERE vip_level IS NULL;

-- 3. Ensure task_settings have the correct combo counts as requested
UPDATE task_settings SET combo_count = 1 WHERE vip_level = 1;
UPDATE task_settings SET combo_count = 2 WHERE vip_level = 2;
UPDATE task_settings SET combo_count = 4 WHERE vip_level = 3;
