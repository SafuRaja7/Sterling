import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Testing DB connection...");
console.log("URL:", supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error("Connection failed:", error.message);
    } else {
      console.log("Connection successful! Count:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

test();
