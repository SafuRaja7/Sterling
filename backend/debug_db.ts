import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  console.log('Testing connection to:', process.env.SUPABASE_URL);
  const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
  if (error) console.error('Connection failed:', error);
  else console.log('Connection successful, user count:', data);
}
run();
