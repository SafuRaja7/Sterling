import { supabase } from '../config/db';

async function runMigration() {
  console.log('🚀 Starting Level Approval System migration...');

  const sql = `
    -- Manual Level Approval System Migration
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS approved_vip_level INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vip_level_request INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vip_level_request_status TEXT DEFAULT 'none' CHECK (vip_level_request_status IN ('none', 'pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS vip_level_approved_at TIMESTAMP WITH TIME ZONE;

    -- Update existing users: If they have balance >= 20, pre-approve VIP 1
    UPDATE users 
    SET approved_vip_level = 1, vip_level_approved_at = NOW()
    WHERE balance >= 20 AND approved_vip_level = 0;
  `;

  console.log('Attempting to run SQL via RPC...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.warn('⚠️ Could not run SQL via RPC. exec_sql function might be missing.');
      console.log('SQL to run manually:\n', sql);
    } else {
      console.log('✅ Migration successful!');
    }
  } catch (e) {
    console.error('❌ Error:', e);
  }
}

runMigration();
