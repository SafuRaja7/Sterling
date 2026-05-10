import { supabase } from './src/config/db';

const test = async () => {
  const email = 'admin@sterlingmarket.local';
  const password = 'admin123';

  console.log('Logging in...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('Login error:', loginError);
  console.log('User ID:', loginData.user?.id);

  console.log('Fetching user profile...');
  const { data: publicUser, error: userError } = await supabase.from('users').select('*').eq('id', loginData.user?.id).single();

  console.log('User error:', userError);
  console.log('Public user:', publicUser);
};

test();
