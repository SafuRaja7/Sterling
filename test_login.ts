import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) console.error("Error", error);
  console.log("Total Auth Users:", users?.users.length);
  
  const emails = users?.users.map(u => ({ email: u.email, meta: u.user_metadata }));
  console.log("Auth Users:", emails?.slice(0, 5));
}
check();
