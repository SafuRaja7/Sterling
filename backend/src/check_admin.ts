import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function checkAdmin() {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'admin')
    .maybeSingle();

  if (error) {
    console.error('Error fetching admin user:', error.message);
  } else if (user) {
    console.log('Admin user found in public.users:', user);
  } else {
    console.log('Admin user NOT found in public.users');
  }
  process.exit(0);
}

checkAdmin();
