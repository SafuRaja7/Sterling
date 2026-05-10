import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { error } = await supabase.from('va_permissions').update({
    can_edit: true,
    can_reset_tasks: true,
    can_approve_requests: true,
    can_approve_finance: true,
    can_combo: true
  }).neq('va_id', '00000000-0000-0000-0000-000000000000');
  
  if (error) console.error(error);
  else console.log('Successfully updated permissions');
}
run();
