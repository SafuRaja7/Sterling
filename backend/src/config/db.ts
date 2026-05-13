import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Service Role Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export const connectDB = async () => {
  try {
    console.log('Supabase initialized with URL:', supabaseUrl);
    console.log('Supabase Key (Service Role) present:', !!supabaseKey);
    console.log('Supabase Key length:', supabaseKey?.length);
    
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('🚀 Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', (error as Error).message);
  }
};
