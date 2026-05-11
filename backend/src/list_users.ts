import { supabase } from './config/db';
import dotenv from 'dotenv';
dotenv.config();

async function listUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('username, email, role');
    
    if (error) {
        console.error("Error fetching users:", error.message);
        return;
    }

    console.log("Registered Users in public.users:");
    console.table(data);
}

listUsers();
