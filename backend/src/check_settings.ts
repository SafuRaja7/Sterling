import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function checkSettings() {
  const { data, error } = await supabase.from('task_settings').select('*');
  console.log('Current Task Settings:');
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

checkSettings();
