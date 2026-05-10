-- ═══════════════════════════════════════════════════════
-- 🚀 STERLING MARKET - TASK SYSTEM MIGRATION
-- ═══════════════════════════════════════════════════════
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard (https://app.supabase.com)
-- 2. Open your project -> SQL Editor
-- 3. Click "+ New Query"
-- 4. Paste ALL the code below and click "RUN"
-- ═══════════════════════════════════════════════════════

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create PRODUCTS Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  price_range_min NUMERIC NOT NULL DEFAULT 20,
  price_range_max NUMERIC NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure unique constraint exists on name
DO $$ 
BEGIN 
  -- First, clean up any existing duplicates so the constraint can be applied
  DELETE FROM products a USING products b
  WHERE a.id < b.id AND a.name = b.name;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_name_key') THEN
    ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
  END IF;
END $$;

-- 2. Create TASK SETTINGS Table
CREATE TABLE IF NOT EXISTS task_settings (
  id SERIAL PRIMARY KEY,
  vip_level INTEGER UNIQUE NOT NULL CHECK (vip_level IN (1, 2, 3)),
  balance_min NUMERIC NOT NULL,
  balance_max NUMERIC NOT NULL,
  commission_start NUMERIC NOT NULL,
  commission_end NUMERIC NOT NULL,
  randomization_pct NUMERIC DEFAULT 5,
  daily_limit INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure unique constraint exists on vip_level
DO $$ 
BEGIN 
  -- Clean up duplicates
  DELETE FROM task_settings a USING task_settings b
  WHERE a.id < b.id AND a.vip_level = b.vip_level;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_settings_vip_level_key') THEN
    ALTER TABLE task_settings ADD CONSTRAINT task_settings_vip_level_key UNIQUE (vip_level);
  END IF;
END $$;

-- 3. Create COMBOS Table
CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  items_count INTEGER DEFAULT 3,
  price NUMERIC NOT NULL,
  commission NUMERIC NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update Users Table (Add Anti-Repetition Column)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='recently_shown_products') THEN
    ALTER TABLE users ADD COLUMN recently_shown_products UUID[] DEFAULT '{}';
  END IF;
END $$;

-- 5. Update Tasks Table (Add Products JSON Column)
DO $$ 
BEGIN 
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='products') THEN
    ALTER TABLE tasks ADD COLUMN products JSONB DEFAULT '[]';
  END IF;
END $$;

-- 6. Insert Default Task Engine Settings
INSERT INTO task_settings (vip_level, balance_min, balance_max, commission_start, commission_end, randomization_pct, daily_limit)
VALUES 
  (1, 0, 398, 6, 23, 5, 20),
  (2, 399, 798, 20, 40, 5, 20),
  (3, 799, 999999, 400, 888, 5, 20)
ON CONFLICT (vip_level) DO NOTHING;

-- 7. Seed Initial Skincare Product Pool
INSERT INTO products (name, category, description, image_url, price_range_min, price_range_max)
VALUES 
  ('Rose Infusion Serum', 'Serum', 'Premium hydrating serum with organic Bulgarian rose extracts.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1000&auto=format&fit=crop', 45, 85),
  ('Arctic Algae Cream', 'Cream', 'Deep-sea mineral cream for intense overnight restoration.', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=1000&auto=format&fit=crop', 60, 120),
  ('Glow Vitamin C Mist', 'Mist', 'Instant radiance booster with active stabilized Vitamin C.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop', 25, 45),
  ('Purifying Clay Mask', 'Mask', 'French pink clay mask for gentle pore detoxification.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop', 35, 65),
  ('Squalane Repair Oil', 'Face Oil', '100% plant-derived squalane for skin barrier reinforcement.', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=1000&auto=format&fit=crop', 55, 95),
  ('Hyaluronic Acid Gel', 'Serum', 'Triple-molecular weight hyaluronic acid for 24h hydration.', 'https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?q=80&w=1000&auto=format&fit=crop', 40, 75)
ON CONFLICT (name) DO NOTHING;
