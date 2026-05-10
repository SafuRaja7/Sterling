import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listAll() {
  const { data, error } = await supabase.from('users').select('id, email, username, role');
  console.log('ALL_USERS:', JSON.stringify(data, null, 2));
}

listAll();
