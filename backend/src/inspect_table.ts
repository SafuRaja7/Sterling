import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function inspectTable() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in users:', Object.keys(data[0]));
  } else if (error) {
    console.error('Error inspecting users:', error);
  } else {
    console.log('No data in users table.');
  }
  process.exit(0);
}

inspectTable();
