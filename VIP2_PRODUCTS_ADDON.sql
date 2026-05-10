-- ═══════════════════════════════════════════════════════
-- 🧴 STERLING MARKET - VIP 2 SKINCARE ADD-ON SEED
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, description, image_url, category, price, commission, vip_level, is_combo_item)
VALUES 
  ('Deep Hydration Sheet Mask', 'Intensive moisture infusion for dehydrated skin.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400', 'Mask', 21.50, 0.95, 2, false),
  ('Probiotic Night Serum', 'Strengthens skin microbiome while you sleep.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400', 'Serum', 27.99, 1.45, 2, false),
  ('Centella Calming Gel', 'Soothing relief for irritated and red skin.', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400', 'Cream', 23.40, 1.10, 2, false),
  ('Rice Water Bright Cleanser', 'Ancient secret for luminous and clear complexion.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400', 'Cleanser', 22.80, 0.85, 2, false),
  ('Bakuchiol Age-Defy Cream', 'Plant-based retinol alternative for firming.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400', 'Cream', 29.50, 1.68, 2, false),
  ('Ginseng Vitality Essence', 'Energizing treatment for dull and tired skin.', 'https://images.unsplash.com/photo-1570172619380-602958742516?auto=format&fit=crop&q=80&w=400', 'Serum', 26.25, 1.22, 2, false),
  ('Marine Collagen Eye Patches', 'Hydrogel patches for instant de-puffing.', 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400', 'Eye Care', 20.90, 0.78, 2, false),
  ('Oat Kernel Nourishing Lotion', 'Barrier-repairing lotion for smooth texture.', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400', 'Cream', 25.10, 1.34, 2, false),
  ('Mugwort Pore Wash', 'Gentle clarifying wash for congested pores.', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400', 'Cleanser', 24.45, 1.15, 2, false),
  ('Tea Tree Blemish Oil', 'Targeted botanical oil for spot treatment.', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400', 'Face Oil', 21.99, 0.92, 2, false)
ON CONFLICT (name) DO UPDATE 
SET 
  price = EXCLUDED.price,
  commission = EXCLUDED.commission,
  vip_level = EXCLUDED.vip_level,
  is_combo_item = EXCLUDED.is_combo_item,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
