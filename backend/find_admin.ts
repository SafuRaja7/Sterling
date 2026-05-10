import { supabase } from './src/config/db';

async function findAdmin() {
  const { data, error } = await supabase
    .from('users')
    .select('email, username')
    .eq('role', 'admin');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('ADMIN_SEARCH_RESULTS:', JSON.stringify(data));
}

findAdmin();
