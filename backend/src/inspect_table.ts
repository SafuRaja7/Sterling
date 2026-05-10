import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function inspectTable() {
  const { data, error } = await supabase.from('task_settings').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in task_settings:', Object.keys(data[0]));
  } else {
    console.log('No data in task_settings or table missing.');
  }
  process.exit(0);
}

inspectTable();
