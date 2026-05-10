import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sterling_jwt_key_2026';

async function test() {
  const { data: session } = await supabase.from('va_sessions').select('*').eq('is_active', true).limit(1).single();
  if (!session) return console.log('No VA session');
  
  const token = jwt.sign({ vaId: session.va_id, sessionToken: session.session_token, type: 'va' }, JWT_SECRET, { expiresIn: '7d' });
  
  try {
    const res = await fetch('http://127.0.0.1:5001/api/admin/chats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Chats length:', data.data?.length);
    if (!data.success) console.log('Error:', data.message);
  } catch(e: any) {
    console.error(e.message);
  }
}
test();
