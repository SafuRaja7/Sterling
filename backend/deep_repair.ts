import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function deepRepair() {
  console.log('--- 🛡️ DEEP ADMIN RECOVERY ---');

  // 1. Find the admin in public table
  const { data: publicAdmins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
  if (!publicAdmins || publicAdmins.length === 0) {
     console.error('No admin found in public.users');
     return;
  }
  const adminId = publicAdmins[0].id;

  // 2. Find the user in AUTH table to get their true email
  const { data: authUser, error: authGetError } = await supabase.auth.admin.getUserById(adminId);
  if (authGetError || !authUser.user) {
    console.error('Could not find user in Supabase Auth:', authGetError?.message);
    return;
  }
  
  const trueEmail = authUser.user.email;
  console.log(`True Email found in Auth: ${trueEmail}`);

  // 3. Fix the public.users table (Sync the email)
  const newUsername = 'Sterling_Elite_2026';
  const { error: syncError } = await supabase
    .from('users')
    .update({ 
      email: trueEmail, 
      username: newUsername 
    })
    .eq('id', adminId);

  if (syncError) {
    console.error('Failed to sync email to public table:', syncError.message);
  } else {
    console.log('✅ Email synced and Username updated in public table.');
  }

  // 4. Force update password again just to be safe
  const newPassword = 'Luxury_Safe_99!';
  await supabase.auth.admin.updateUserById(adminId, { password: newPassword });
  console.log('✅ Password set to: Luxury_Safe_99!');

  // 5. Clear VA conflicts
  await supabase.from('va_accounts').delete().eq('username', newUsername);
  console.log('✅ Conflicts cleared.');

  console.log('\n--- 🚀 RECOVERY COMPLETE ---');
  console.log(`Email for Login: ${trueEmail}`);
  console.log(`Username for Login: ${newUsername}`);
  console.log(`Password: ${newPassword}`);
}

deepRepair();
