-- ═══════════════════════════════════════════════════════
-- 🧴 STERLING MARKET - VIP 2 SKINCARE PRODUCT SEED (CONFLICT-SAFE)
-- ═══════════════════════════════════════════════════════

-- Ensure columns exist before inserting
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='vip_level') THEN
    ALTER TABLE products ADD COLUMN vip_level INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_combo_item') THEN
    ALTER TABLE products ADD COLUMN is_combo_item BOOLEAN DEFAULT false;
  END IF;
END $$;

INSERT INTO products (name, description, image_url, category, price, commission, vip_level, is_combo_item)
VALUES 
  ('Glow Elixir Serum', 'Advanced radiance-boosting formula with Vitamin C.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400', 'Serum', 24.50, 0.82, 2, false),
  ('Hyaluronic Cloud Cleanser', 'Ultra-hydrating daily foaming cleanser.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400', 'Cleanser', 21.99, 1.15, 2, false),
  ('Midnight Retinol Repair', 'Potent night cream for youthful skin texture.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400', 'Cream', 28.75, 0.94, 2, false),
  ('Arctic Face Mist', 'Refreshing botanical mist for instant hydration.', 'https://images.unsplash.com/photo-1570172619380-602958742516?auto=format&fit=crop&q=80&w=400', 'Mist', 22.40, 1.28, 2, false),
  ('Ceramide Barrier Balm', 'Deeply nourishing balm for sensitive skin.', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400', 'Cream', 26.10, 1.47, 2, false),
  ('Volcanic Ash Detox Mask', 'Purifying clay mask for clear, smooth skin.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400', 'Mask', 23.85, 0.76, 2, false),
  ('Rosehip Revive Face Oil', 'Cold-pressed organic oil for natural glow.', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400', 'Face Oil', 27.50, 1.36, 2, false),
  ('Peptide Lifting Eye Cream', 'Targeted treatment for fine lines and dark circles.', 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400', 'Eye Care', 25.99, 0.88, 2, false),
  ('Green Tea Purifying Toner', 'Calming toner with antioxidant-rich extracts.', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400', 'Toner', 21.45, 1.54, 2, false),
  ('Squalane Hydration Gel', 'Lightweight gel-moisturizer for all skin types.', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400', 'Cream', 29.20, 1.12, 2, false),
  ('Niacinamide Pore Solution', 'Refining serum for balanced and clear skin.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400', 'Serum', 22.99, 0.97, 2, false),
  ('Bamboo Exfoliating Scrub', 'Gentle physical exfoliant for soft skin.', 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&q=80&w=400', 'Cleanser', 24.15, 1.41, 2, false),
  ('Collagen Plumping Serum', 'Firming serum with marine collagen peptides.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400', 'Serum', 27.80, 0.69, 2, false),
  ('Shea Butter Lip Therapy', 'Intensive repair for dry and chapped lips.', 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400', 'Eye Care', 20.50, 1.63, 2, false),
  ('AHA/BHA Peeling Liquid', 'Powerful chemical exfoliant for resurfacing.', 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400', 'Serum', 25.40, 1.08, 2, false),
  ('Probiotic Defense Cream', 'Strengthening day cream for skin resilience.', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400', 'Cream', 26.90, 1.25, 2, false),
  ('Mineral Zinc Sunscreen', 'Broad-spectrum SPF 50 mineral protection.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400', 'Sunscreen', 29.99, 1.34, 2, false),
  ('Salicylic Spot Gel', 'Fast-acting treatment for blemish control.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400', 'Serum', 21.10, 4.31, 2, false)
ON CONFLICT (name) DO UPDATE 
SET 
  price = EXCLUDED.price,
  commission = EXCLUDED.commission,
  vip_level = EXCLUDED.vip_level,
  is_combo_item = EXCLUDED.is_combo_item,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
