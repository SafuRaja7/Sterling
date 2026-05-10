import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('Connected to DB for seeding...');

    // Check if admin exists
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (adminExists) {
      console.log('Admin user already exists. Seed skipped.');
      process.exit(0);
    }

    const email = 'admin@sterlingmarket.local';
    const password = 'admin123';

    // Create admin in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: 'admin' }
    });

    if (authError) {
      throw authError;
    }

    const userId = authData.user.id;

    // The trigger will create the public.users row with role='user'.
    // We need to update it to role='admin'.
    
    // Give the trigger a moment to run
    await new Promise(resolve => setTimeout(resolve, 1000));

    await supabase.from('users').update({ 
      role: 'admin',
      vip_level: 3
    }).eq('id', userId);

    console.log('Admin user seeded successfully. Username: admin, Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedAdmin();
