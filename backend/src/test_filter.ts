import { supabase } from './config/db';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*');
    
    console.log("Total transactions:", data?.length);
    
    const { data: filtered, error: err2 } = await supabase
        .from('transactions')
        .select('*')
        .neq('admin_remarks', 'VIP_UNLOCK_REQUEST');
    
    console.log("Filtered transactions (neq):", filtered?.length);

    const { data: nulls } = await supabase
        .from('transactions')
        .select('id, admin_remarks')
        .is('admin_remarks', null);
    
    console.log("Transactions with NULL admin_remarks:", nulls?.length);
}

test();
