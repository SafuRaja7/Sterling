import { supabase } from './src/config/db';

const checkDb = async () => {
  const { data: users, error } = await supabase.from('users').select('*');
  console.log('public.users:', users, 'error:', error);
  
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  console.log('auth.users:', authUsers.users.map(u => ({ id: u.id, email: u.email })), 'error:', authError);
};

checkDb();
