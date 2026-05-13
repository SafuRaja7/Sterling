import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { createClient } from '@supabase/supabase-js';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Validate invite code or username if provided
    let referredBy = null;
    if (inviteCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .or(`invite_code.eq.${inviteCode},username.ilike.${inviteCode}`)
        .maybeSingle();
        
      if (referrer) {
        referredBy = referrer.id;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid invite code or username' });
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

    // --- RACE CONDITION FIX: Wait for DB trigger to create profile ---
    console.log(`--- REGISTRATION: WAITING FOR PROFILE ${userId} ---`);
    let profileCreated = false;
    for (let i = 0; i < 5; i++) {
      const { data: check } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
      if (check) {
        profileCreated = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
    }

    if (!profileCreated) {
      console.error(`--- REGISTRATION ERROR: PROFILE NOT CREATED FOR ${userId} ---`);
      // Fallback: manually create profile if trigger failed
      await supabase.from('users').insert({
        id: userId,
        username,
        role: 'user',
        vip_level: 0
      });
    }

    // Now update with referral and VIP 0
    const updates: any = { vip_level: 0 };
    if (referredBy) updates.referred_by = referredBy;
    
    const { error: updateError } = await supabase.from('users').update(updates).eq('id', userId);
    if (updateError) console.error('--- REGISTRATION UPDATE FAIL ---', updateError.message);
    // ------------------------------------------------------------------

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
        email: email,
        role: publicUser?.role || 'user',
        balance: publicUser?.balance ?? 0,
        vipLevel: publicUser?.vip_level ?? 0,
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
    console.log(`--- LOGIN ATTEMPT: ${username} ---`);
    
    // Find the user's email from Supabase Auth if they provided a username
    let email = username; 
    if (!username.includes('@')) {
      console.log(`--- LOOKING UP EMAIL FOR USERNAME: ${username} ---`);
      
      // Step 1: Query public.users to get the user ID
      const { data: dbUser } = (await supabase.from('users').select('id').ilike('username', username).maybeSingle()) as any;
      
      if (dbUser && dbUser.id) {
        // Step 2: Fetch auth user by ID to get their true email
        const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(dbUser.id);
        if (authUser?.user?.email) {
          email = authUser.user.email;
          console.log(`--- MAPPED USERNAME ${username} TO EMAIL ${email} ---`);
        }
      } else {
        // Fallback to legacy listUsers if not in public.users yet
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const fallbackUser = authUsers?.users?.find(u => 
          u.user_metadata?.username?.toLowerCase() === username.toLowerCase() ||
          u.email?.split('@')[0].toLowerCase() === username.toLowerCase()
        );
        if (fallbackUser && fallbackUser.email) {
          email = fallbackUser.email;
          console.log(`--- MAPPED USERNAME ${username} TO EMAIL ${email} (Fallback) ---`);
        } else {
          return res.status(401).json({ success: false, message: `User '${username}' not found.` });
        }
      }
    }

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
      console.error('--- AUTH ERROR ---', loginError.message);
      return res.status(401).json({ success: false, message: `Auth Failed: ${loginError.message}` });
    }
    const { data: testUsers } = await supabase.from('users').select('username').limit(5);
    console.log('--- DB TEST (first 5 users):', testUsers?.map(u => u.username).join(', '));

    const userId = loginData.user?.id;
    const userEmail = loginData.user?.email;
    console.log(`--- AUTH SUCCESS: ID=${userId}, Email=${userEmail} ---`);

    // Use a direct client for profile fetch to be safe
    const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false }
    });

    // Step 1: Try fetching from the users table by ID
    let { data: publicUser, error: userError } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();

    // Step 2: If not found, try getting from Auth Admin API to see if they exist there
    if (!publicUser && !userError) {
      console.warn(`--- PROFILE NOT FOUND BY ID: ${userId}, checking Admin Auth... ---`);
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authUser) {
        console.log(`--- AUTH USER FOUND, RECOVERING VIA USERNAME ---`);
        const username_fallback = authUser.user_metadata?.username || authUser.email?.split('@')[0];
        const { data: recoveredUser } = await supabaseAdmin.from('users').select('*').ilike('username', username_fallback).maybeSingle();
        if (recoveredUser) {
          publicUser = recoveredUser;
          // IMPORTANT: Update the user ID in the database if it doesn't match!
          if (recoveredUser.id !== userId) {
             console.log(`--- UPDATING USER ID IN DB FOR ${username_fallback} ---`);
             await supabaseAdmin.from('users').update({ id: userId }).eq('username', recoveredUser.username);
          }
        }
      }
    }

    if (userError || !publicUser) {
      console.error('--- PROFILE FETCH ERROR ---', {
        error: userError,
        requestedId: userId,
        requestedEmail: userEmail,
        identifier: username
      });
      return res.status(500).json({ success: false, message: 'Error fetching user profile' });
    }

    // --- TRANSACTION-VERIFIED VIP LEVEL ENFORCEMENT ---
    const { data: approvedRequests } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('admin_remarks', 'VIP_UNLOCK_REQUEST')
      .eq('status', 'approved');
    
    const highestApprovedLevel = approvedRequests?.reduce((max, r) => Math.max(max, Number(r.amount)), 0) || 0;
    
    if (publicUser.role === 'user' && Number(publicUser.vip_level) > highestApprovedLevel) {
      await supabase.from('users').update({ vip_level: highestApprovedLevel }).eq('id', userId);
      publicUser.vip_level = highestApprovedLevel;
    }
    // --------------------------------------------------

    console.log(`--- LOGIN SUCCESS: ${publicUser.username} (${publicUser.role}) ---`);

    res.json({
      success: true,
      data: {
        _id: userId,
        username: publicUser.username,
        email: loginData.user?.email, // Use email from Auth
        role: publicUser.role,
        balance: publicUser.balance ?? 0,
        vipLevel: publicUser.vip_level ?? 0,
        completedTasksToday: publicUser.completed_tasks_today ?? 0,
        totalCommission: publicUser.total_commission ?? 0,
        inviteCode: publicUser.invite_code ?? '',
        avatar: publicUser.avatar ?? null,
        token: loginData.session?.access_token,
      },
    });
  } catch (error: any) {
    console.error('--- LOGIN CRASH ---', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
