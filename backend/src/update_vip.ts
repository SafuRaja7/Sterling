import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function updateVIP() {
  console.log('Updating VIP settings...');
  
  const updates = [
    { level: 1, name: 'VIP 1 - Shopify', min: 20, max: 398, comm: 4 },
    { level: 2, name: 'VIP 2 - Shopify', min: 399, max: 798, comm: 8 },
    { level: 3, name: 'VIP 3 - Shopify', min: 799, max: 999999, comm: 12 },
  ];

  for (const up of updates) {
    const { error } = await supabase
      .from('task_settings')
      .update({
        level_name: up.name,
        balance_min: up.min,
        balance_max: up.max,
        fixed_commission: up.comm,
        min_access_balance: up.min,
        total_orders: 20
      })
      .eq('vip_level', up.level);

    if (error) {
      console.error(`Error updating VIP ${up.level}:`, error);
    } else {
      console.log(`Updated VIP ${up.level} successfully.`);
    }
  }
  process.exit(0);
}

updateVIP();
