import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function masterReset() {
  console.log('--- 🛡️ MASTER ADMIN RE-INITIALIZATION ---');
  
  const adminId = '3bbc3163-5126-4346-acaa-f972faf44b67';
  const newUsername = 'Admin_Master';
  const newPassword = 'Sterling_2026_Elite!';
  const email = 'admin@sterlingmarket.local';

  // 1. Force update the Auth account (The core security layer)
  const { error: authError } = await supabase.auth.admin.updateUserById(adminId, {
    email: email,
    password: newPassword,
    email_confirm: true
  });

  if (authError) {
    console.error('FAILED to update Auth account:', authError.message);
    // If it failed because user doesn't exist in Auth, we would need to create it
    // But since it appeared in the list (if it was from Auth sync), it should exist.
  } else {
    console.log('✅ Auth credentials updated.');
  }

  // 2. Force update the Public Profile
  const { error: publicError } = await supabase
    .from('users')
    .update({ 
      username: newUsername, 
      email: email,
      role: 'admin' 
    })
    .eq('id', adminId);

  if (publicError) {
    console.error('FAILED to update Public Profile:', publicError.message);
  } else {
    console.log(`✅ Public profile updated. Username is now: ${newUsername}`);
  }

  // 3. Clear any conflicting VA accounts
  await supabase.from('va_accounts').delete().eq('username', newUsername);
  console.log('✅ VA conflicts cleared.');

  console.log('\n--- 🚀 MASTER RESET COMPLETE ---');
  console.log(`Username: ${newUsername}`);
  console.log(`Password: ${newPassword}`);
  console.log('---------------------------');
}

masterReset();
