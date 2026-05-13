import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data: users } = await supabase.from('users').select('id, username, referred_by').in('username', ['hamza2', 'hamza3']);
  console.log(JSON.stringify(users, null, 2));
}
check();
