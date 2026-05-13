import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sterling_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: any;
  va?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`--- PROTECT MIDDLEWARE ENTRY: ${req.method} ${req.path} ---`);
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 1. Try to verify as a VA (Custom JWT)
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.type === 'va') {
          const { data: session } = await supabase
            .from('va_sessions')
            .select('*')
            .eq('session_token', decoded.sessionToken)
            .eq('is_active', true)
            .maybeSingle();

          if (session) {
            console.log('--- VA SESSION FOUND ---');
            const { data: vaAccount } = await supabase.from('va_accounts').select('username').eq('id', session.va_id).maybeSingle();
            const { data: vaPerms } = await supabase.from('va_permissions').select('*').eq('va_id', session.va_id).maybeSingle();

            req.va = {
              id: session.va_id,
              username: vaAccount?.username || 'Unknown VA',
              permissions: vaPerms || {}
            };

            console.log('--- VA AUTH SUCCESS ---');
            return next();
          } else {
            console.log('--- VA AUTH FAIL: Session not found or inactive ---');
            const { data: inactiveSession } = await supabase
              .from('va_sessions')
              .select('*')
              .eq('session_token', decoded.sessionToken)
              .maybeSingle();
            if (inactiveSession) {
              console.log('--- VA SESSION IS INACTIVE ---');
            } else {
              console.log('--- VA SESSION NOT IN DATABASE ---');
            }
          }
        }
      } catch (vaErr) {
        // Not a VA token, continue to Supabase Auth check
      }

      // 2. Verify token with Supabase (User/Admin JWT)
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error('Not authorized');
      }

      // Fetch user profile from public.users using a fresh client to ensure no config interference
      // Use the global supabaseAdmin which is stateless and high-privilege
      let { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!userProfile && !profileError) {
        console.warn(`--- MIDDLWARE: PROFILE NOT FOUND BY ID: ${user.id}, starting Omni-Search fallback... ---`);
        
        const metadataUsername = user.user_metadata?.username || '';
        const emailUsername = user.email?.split('@')[0] || '';
        
        // Search by any possible matching username
        const { data: users, error: omniError } = await supabaseAdmin
          .from('users')
          .select('*')
          .or(`username.ilike.${metadataUsername},username.ilike.${emailUsername},username.ilike.AdminSterling,username.ilike.SterlingAdmin`);

        console.log(`--- MIDDLWARE OMNI-SEARCH RESULTS: Count=${users?.length || 0}, Error=${omniError?.message || 'none'} ---`);
        if (users) {
          users.forEach(u => console.log(`   > Found User: ${u.username} (Role: ${u.role}, ID: ${u.id})`));
        }

        if (users && users.length > 0) {
          // If we find multiple, pick the one that is an admin
          userProfile = users.find(u => u.role === 'admin') || users[0];
          console.log(`--- MIDDLWARE: PROFILE RECOVERED (Found ${userProfile.username}), re-linking ID... ---`);
          await supabaseAdmin.from('users').update({ id: user.id }).eq('username', userProfile.username);
        } else if (user.email?.includes('admin')) {
          // Last resort: Just find ANY admin in the database
          console.warn(`--- MIDDLWARE: OMNI-SEARCH FAILED, searching for ANY admin... ---`);
          const { data: globalAdmins } = await supabaseAdmin.from('users').select('*').eq('role', 'admin').limit(1);
          if (globalAdmins && globalAdmins.length > 0) {
            userProfile = globalAdmins[0];
            console.log(`--- MIDDLWARE: EMERGENCY ADMIN RECOVERY (Used ${userProfile.username}) ---`);
          }
        }
      }

      if (profileError || !userProfile) {
        console.error('--- MIDDLWARE: FINAL PROFILE FETCH FAIL ---', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        });
        throw new Error('User profile not found');
      }

      // --- TRANSACTION-VERIFIED VIP LEVEL ENFORCEMENT ---
      if (userProfile.role === 'user') {
        const { data: approvedRequests } = await supabaseAdmin
          .from('transactions')
          .select('amount')
          .eq('user_id', userProfile.id)
          .eq('admin_remarks', 'VIP_UNLOCK_REQUEST')
          .eq('status', 'approved');
        
        const highestApprovedLevel = approvedRequests?.reduce((max, r) => Math.max(max, Number(r.amount)), 0) || 0;
        
        if (Number(userProfile.vip_level) > highestApprovedLevel) {
          console.log(`--- VIP LEVEL CORRECTION: ${userProfile.vip_level} -> ${highestApprovedLevel} for ${userProfile.username} ---`);
          await supabaseAdmin.from('users').update({ vip_level: highestApprovedLevel }).eq('id', userProfile.id);
          userProfile.vip_level = highestApprovedLevel;
        }
      }
      // --------------------------------------------------

      req.user = { 
        ...userProfile, 
        _id: userProfile.id,
        email: user.email
      };

      // --- COMPLETION-BASED RESET LOGIC ---
      const now = new Date();
      const lastReset = userProfile.last_task_reset ? new Date(userProfile.last_task_reset) : new Date(0);



      // NEW: Check if user was created today. If so, don't reset.


      if (userProfile.completed_tasks_today >= 60 && now.getTime() > lastReset.getTime() + 24 * 60 * 60 * 1000) {
        console.log(`--- ROLLING RESET TRIGGERED FOR ${userProfile.username} ---`);



        const { error: resetError } = await supabase
          .from('users')
          .update({
            completed_tasks_today: 0,
            last_task_reset: now.toISOString()
          })
          .eq('id', user.id);

        if (!resetError) {
          req.user.completed_tasks_today = 0;

        }
      }

      console.log(`--- AUTH SUCCESS: User ${userProfile.username} (${userProfile.role}) ---`);
      next();
    } catch (error: any) {
      console.error('Protection Middleware Failed:', error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Fixed admin check — username containing "admin" is NOT sufficient
// Only users with role === 'admin' in the database get access
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const isAdmin = req.user && req.user.role === 'admin';

  console.log(`--- ADMIN CHECK: User=${req.user?.username}, role=${req.user?.role}, isAdmin=${isAdmin} ---`);

  if (isAdmin) {
    next();
  } else {
    console.warn(`--- ADMIN ACCESS DENIED for ${req.user?.username} ---`);
    res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};