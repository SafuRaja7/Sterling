import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
// Fresh client without signInWithPassword
const test2 = async () => {
  const userId = '3bbc3163-5126-4346-acaa-f972faf44b67';
  console.log('Fetching user profile with fresh service client...');
  const { data: publicUser, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();

  console.log('User error:', userError);
  console.log('Public user:', publicUser);
};

test2();
