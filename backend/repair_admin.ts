import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairAdmin() {
  console.log('--- 🔧 ADMIN REPAIR SYSTEM ---');
  
  // 1. Find the admin user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, username')
    .eq('role', 'admin')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('Could not find any admin user in the database.');
    return;
  }

  const admin = users[0];
  const newUsername = 'Sterling_Elite_2026';
  const newPassword = 'Luxury_Safe_99!';

  console.log(`Found Admin: ${admin.email} (${admin.username})`);

  // 2. Update Auth Password via Admin API (100% Reliable)
  const { error: authError } = await supabase.auth.admin.updateUserById(
    admin.id,
    { password: newPassword }
  );

  if (authError) {
    console.error('Failed to update auth password:', authError.message);
    return;
  }
  console.log('✅ Auth password updated successfully.');

  // 3. Update Public Username
  const { error: profileError } = await supabase
    .from('users')
    .update({ username: newUsername })
    .eq('id', admin.id);

  if (profileError) {
    console.error('Failed to update public username:', profileError.message);
  } else {
    console.log(`✅ Public username updated to: ${newUsername}`);
  }

  // 4. Remove any conflicting VA account
  await supabase.from('va_accounts').delete().eq('username', newUsername);
  console.log('✅ Conflicting VA accounts cleared.');

  console.log('\n--- 🚀 REPAIR COMPLETE ---');
  console.log(`Username: ${newUsername}`);
  console.log(`Password: ${newPassword}`);
  console.log('---------------------------');
}

repairAdmin();
