import { supabase } from './src/config/db';

const checkSupport = async () => {
  console.log('--- Checking Support Tables ---');
  
  const { data: threads, error: threadError } = await supabase.from('support_threads').select('*');
  console.log('support_threads:', threads ? threads.length : 0, 'items');
  if (threadError) console.error('Error fetching support_threads:', threadError);
  
  const { data: messages, error: messageError } = await supabase.from('support_messages').select('*');
  console.log('support_messages:', messages ? messages.length : 0, 'items');
  if (messageError) console.error('Error fetching support_messages:', messageError);

  const { data: users, error: userError } = await supabase.from('users').select('id, username').eq('role', 'admin');
  console.log('Admins found:', users);
  if (userError) console.error('Error fetching admins:', userError);
};

checkSupport();
