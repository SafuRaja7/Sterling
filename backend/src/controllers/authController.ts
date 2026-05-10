import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { createClient } from '@supabase/supabase-js';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Validate invite code if provided
    let referredBy = null;
    if (inviteCode) {
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();
        
      if (referrer) {
        referredBy = referrer.id;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid invite code' });
      }
    }

    // Register user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // If referredBy is set, update the user in public.users
    // Note: The public.users row is created via a database trigger automatically,
    // so we just need to update it here.
    if (referredBy) {
      await supabase.from('users').update({ referred_by: referredBy }).eq('id', userId);
    }

    // Now sign them in to get a token
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) throw loginError;

    // Fetch the public user data
    const { data: publicUser } = await supabase.from('users').select('*').eq('id', userId).single();

    res.status(201).json({
      success: true,
      data: {
        _id: userId,
        username: publicUser?.username || username,
        email: publicUser?.email || email,
        role: publicUser?.role || 'user',
        balance: publicUser?.balance ?? 0,
        vipLevel: publicUser?.vip_level ?? 1,
        completedTasksToday: publicUser?.completed_tasks_today ?? 0,
        totalCommission: publicUser?.total_commission ?? 0,
        inviteCode: publicUser?.invite_code ?? '',
        avatar: publicUser?.avatar ?? null,
        token: loginData.session?.access_token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Find the user's email from our public.users table if they provided a username
    let email = username; 
    if (!username.includes('@')) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .maybeSingle();
      
      if (userRecord && userRecord.email) {
        email = userRecord.email;
      } else {
        // No user found with that username
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
    }

    // Create a fresh client for this request to avoid session bleeding
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const userId = loginData.user?.id;

    // Fetch the public user data
    const { data: publicUser, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();

    if (userError) {
      return res.status(500).json({ success: false, message: 'Error fetching user profile' });
    }

    res.json({
      success: true,
      data: {
        _id: userId,
        username: publicUser.username,
        email: publicUser.email,
        role: publicUser.role,
        balance: publicUser.balance ?? 0,
        vipLevel: publicUser.vip_level ?? 1,
        completedTasksToday: publicUser.completed_tasks_today ?? 0,
        totalCommission: publicUser.total_commission ?? 0,
        inviteCode: publicUser.invite_code ?? '',
        avatar: publicUser.avatar ?? null,
        token: loginData.session?.access_token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
