import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sterling_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: any;
  va?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // 1. Try to verify as a VA (Custom JWT)
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.type === 'va') {
          // Verify session in DB
          const { data: session } = await supabase
            .from('va_sessions')
            .select('*')
            .eq('session_token', decoded.sessionToken)
            .eq('is_active', true)
            .maybeSingle();

          if (session) {
            console.log('--- VA SESSION FOUND ---');
            
            // Fetch account and permissions separately for maximum reliability
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
            // Check if the session exists at all (ignoring is_active for debug)
            const { data: inactiveSession } = await supabase.from('va_sessions').select('*').eq('session_token', decoded.sessionToken).maybeSingle();
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

      // Fetch user profile from public.users
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      req.user = { ...userProfile, _id: userProfile.id };
      
      // --- DAILY RESET LOGIC ---
      const now = new Date();
      const lastReset = userProfile.last_task_reset ? new Date(userProfile.last_task_reset) : new Date(0);
      const diffHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 24) {
        console.log(`--- PERFORMING DAILY RESET FOR ${userProfile.username} ---`);
        const { error: resetError } = await supabase
          .from('users')
          .update({
            completed_tasks_today: 0,
            vip_level: 0, // Reset to 0 so they must unlock level 1 again
            last_task_reset: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', user.id);

        if (!resetError) {
          req.user.completed_tasks_today = 0;
          req.user.vip_level = 0;
        }
      }

      console.log(`--- AUTH SUCCESS: User ${userProfile.username} (${userProfile.role}) ---`);
      next();
    } catch (error: any) {
      console.error("Protection Middleware Failed:", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const isMaster = req.user?.username?.toLowerCase().includes('admin');
  const isAdmin = req.user && req.user.role === 'admin';
  
  console.log(`--- ADMIN CHECK: User=${req.user?.username}, role=${req.user?.role}, isMaster=${isMaster}, isAdmin=${isAdmin} ---`);

  if (isMaster || isAdmin) {
    next();
  } else {
    console.warn(`--- ADMIN ACCESS DENIED for ${req.user?.username} ---`);
    res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};
