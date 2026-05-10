-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING MARKET - PRODUCT SCHEMA REFINEMENT
-- ═══════════════════════════════════════════════════════

-- 1. Rename columns in products table for better clarity
ALTER TABLE products 
RENAME COLUMN price_range_min TO price;

ALTER TABLE products 
RENAME COLUMN price_range_max TO commission;

-- Update existing products to have reasonable commissions if they were ranges
-- (Optional: set a default if they were high max prices)
UPDATE products SET commission = 0.5 WHERE commission > 100;
