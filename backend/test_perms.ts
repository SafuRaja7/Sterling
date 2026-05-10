import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: vas, error } = await supabase.from('va_accounts').select('*, va_permissions(*)');
  console.log(JSON.stringify(vas, null, 2));
}
test();
