import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/db';

const mapUserToCamelCase = (user: any) => {
  if (!user) return null;
  const activeCombos = user.combos ? user.combos.filter((c: any) => c.status === 'active' || c.status === 'scheduled').map((c: any) => c.position).join(', ') : '';
  return {
    _id: user.id,
    username: user.username,
    role: user.role,
    balance: Number(user.balance),
    vipLevel: user.vip_level,
    completedTasksToday: user.completed_tasks_today,
    totalDeposited: Number(user.total_deposited),
    totalWithdrawn: Number(user.total_withdrawn),
    totalCommission: Number(user.total_commission),
    inviteCode: user.invite_code,
    pendingTask: user.pending_task,
    isTaskLocked: user.is_task_locked || false,
    currentSessionCommission: Number(user.current_session_commission || 0),
    createdAt: user.created_at,
    activeCombos,
    approvedVipLevel: user.approvedVipLevel || 0, // Use virtual field if present
    vipLevelRequest: user.vipLevelRequest || 0,
    vipLevelRequestStatus: user.vipLevelRequestStatus || 'none',
    vipLevelApprovedAt: user.vip_level_approved_at,
    withdrawalAddress: user.withdrawal_address,
    referredBy: user.referred_by
  };
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    console.log('--- ADMIN: FETCHING USERS ---');
    const { data: users, error, count } = await supabaseAdmin
      .from('users')
      .select('*, combos(position, status)', { count: 'exact' })
      .eq('role', 'user')
      .order('created_at', { ascending: false });
      
    console.log(`--- ADMIN: FETCHED ${users?.length || 0} USERS (Total count: ${count}), Error: ${error?.message || 'none'} ---`);
    if (error) throw error;
    res.json({ success: true, data: users.map(mapUserToCamelCase) });
  } catch (error) {
    console.error('--- ADMIN: GET USERS FAIL ---', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getReferrals = async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, referred_by, created_at')
      .not('referred_by', 'is', null);
      
    if (error) throw error;

    // Fetch referrer names
    const referralList = await Promise.all(users.map(async (u) => {
      const { data: referrer } = await supabase.from('users').select('username').eq('id', u.referred_by).single();
      return {
        _id: u.id,
        username: u.username,
        referrer: referrer?.username || 'Unknown',
        createdAt: u.created_at
      };
    }));

    res.json({ success: true, data: referralList });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const editUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { balance, vipLevel, isTaskLocked, withdrawalAddress, username, password } = req.body;

    const updates: any = {};
    if (balance !== undefined) updates.balance = Number(balance);
    if (vipLevel !== undefined) updates.vip_level = Number(vipLevel);
    if (withdrawalAddress !== undefined) updates.withdrawal_address = withdrawalAddress;
    if (username !== undefined) updates.username = username;

    if (isTaskLocked !== undefined) {
      const { error: lockProbeError } = await supabase.from('users').select('is_task_locked').limit(1);
      if (!lockProbeError) {
        updates.is_task_locked = isTaskLocked;
      }
    }

    // 1. Fetch current user to compare level
    const { data: oldUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('vip_level, username, balance, total_deposited, withdrawal_address')
      .eq('id', userId)
      .single();
    
    if (fetchError || !oldUser) throw new Error('User not found');

    // 2. Update Profile in public.users
    let user;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      user = data;

      // ONLY clear combos if the level actually CHANGED to a DIFFERENT level
      if (vipLevel !== undefined && Number(vipLevel) !== Number(oldUser.vip_level)) {
        await supabaseAdmin
          .from('combos')
          .delete()
          .eq('user_id', userId)
          .eq('status', 'scheduled');
        console.log(`--- COMBOS REFRESHED FOR ${user.username}: Level ${oldUser.vip_level} -> ${vipLevel} ---`);
      }
    } else {
      user = oldUser;
    }

    // 2. Update Auth Password if provided
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });
      if (authError) throw authError;
    }

    res.json({ success: true, message: 'User updated successfully', data: mapUserToCamelCase(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const changeAdminPassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminEmail = req.user.email;
    const adminId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
    }

    // 1. Verify current password using a SEPARATE, isolated Supabase client.
    //    NEVER use the shared `supabase` client for signIn — it overwrites the server session
    //    and causes the dashboard to lose its database connection after a password change.
    const { createClient } = await import('@supabase/supabase-js');
    const verifyClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: adminEmail,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // 2. Update password using the high-privilege admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
      password: newPassword
    });

    if (updateError) throw updateError;

    // 3. Re-authenticate with the new password to get a fresh access token.
    //    When Supabase changes the password, it invalidates the old token.
    //    We MUST return a new token so the frontend can update localStorage
    //    and avoid a 401 on the next page refresh.
    const freshClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: freshSession, error: freshError } = await freshClient.auth.signInWithPassword({
      email: adminEmail,
      password: newPassword
    });

    if (freshError || !freshSession?.session) {
      // Password was changed but we couldn't get a fresh token — still a success, just warn
      return res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
      newToken: freshSession.session.access_token
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const scheduleCombo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { combos } = req.body;

    // 1. Fetch existing combos for this user that are not completed
    const { data: existingCombos } = await supabase
      .from('combos')
      .select('position')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'active']);

    const existingPositions = (existingCombos || []).map(c => Number(c.position));

    if (Array.isArray(combos)) {
      // Check for duplicates within the new batch
      const newPositions = combos.map(c => Number(c.position));
      const hasDuplicatesInBatch = newPositions.some((pos, idx) => newPositions.indexOf(pos) !== idx);
      if (hasDuplicatesInBatch) {
        return res.status(400).json({ success: false, message: 'Duplicate positions detected in your request.' });
      }

      // Check against existing positions
      for (const pos of newPositions) {
        if (existingPositions.includes(pos)) {
          return res.status(400).json({ success: false, message: `A combo is already scheduled at position ${pos}.` });
        }
      }

      const finalCombos = combos.map((c: any) => ({
        user_id: userId,
        position: Number(c.position),
        items_count: Number(c.itemsCount || 3),
        price: Number(c.price),
        commission: Number(c.commission),
        status: 'scheduled'
      }));

      const { data, error } = await supabase.from('combos').insert(finalCombos);
      if (error) throw error;
      return res.json({ success: true, data });
    } else {
      const { position, itemsCount, price, commission } = req.body;
      const pos = Number(position);

      if (existingPositions.includes(pos)) {
        return res.status(400).json({ success: false, message: `A combo is already scheduled at position ${pos}.` });
      }

      const { data: combo, error } = await supabase
        .from('combos')
        .insert({
          user_id: userId,
          position: pos,
          items_count: Number(itemsCount || 3),
          price: Number(price),
          commission: Number(commission),
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data: combo });
    }
  } catch (error) {
    console.error('INJECTION ERROR:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUserCombos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('combos')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'active'])
      .order('position', { ascending: true });
      
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const refreshUserOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: user } = await supabase
      .from('users')
      .select('pending_task')
      .eq('id', userId)
      .single();

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Cancel active/pending tasks
    if (user.pending_task) {
      await supabase.from('tasks').update({ status: 'frozen' }).eq('id', user.pending_task);
    }

    // Reset user daily tasks and remove pending task
    await supabase.from('users').update({ 
      completed_tasks_today: 0,
      pending_task: null
    }).eq('id', userId);

    // Cancel pending combos
    await supabase.from('combos').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'scheduled');

    res.json({ success: true, message: 'User tasks refreshed' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const approveTransaction = async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', txId)
      .single();

    if (!transaction) return res.status(404).json({ success: false, message: 'Tx not found' });
    
    if (transaction.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Already processed' });
    }

    // Update transaction
    await supabase.from('transactions').update({ status }).eq('id', txId);

    if (status === 'approved') {
      const { data: user } = await supabase.from('users').select('*').eq('id', transaction.user_id).single();
      
      if (user) {
        if (transaction.type === 'deposit') {
          const newBalance = Number(user.balance) + Number(transaction.net_amount);
          
          await supabase.from('users').update({
            balance: newBalance,
            total_deposited: Number(user.total_deposited) + Number(transaction.net_amount)
          }).eq('id', user.id);
        } else if (transaction.type === 'withdrawal') {
          // Deduct balance on approval. Balance was NOT touched when the user submitted the request.
          const newBalance = Math.max(0, Number(user.balance) - Number(transaction.amount));
          await supabaseAdmin.from('users').update({
            balance: newBalance,
            total_withdrawn: Number(user.total_withdrawn) + Number(transaction.amount)
          }).eq('id', user.id);
        }
      }
    }

    res.json({ success: true, data: { ...transaction, status } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const { count: totalUsers } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
        
        let totalDeposits = 0;
        let pendingWithdrawals = 0;

        try {
            const { data: deposits } = await supabase.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'approved');
            totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
            
            const { count: pendingCount } = await supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending');
            pendingWithdrawals = pendingCount || 0;
        } catch (e) {
            console.warn("Transactions table might be missing");
        }

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers || 0,
                totalDeposits,
                pendingWithdrawals
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .select(`
                *,
                users (
                    username,
                    vip_level,
                    balance
                )
            `)
            .or('admin_remarks.is.null,admin_remarks.neq.VIP_UNLOCK_REQUEST')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// --- TASK SETTINGS ---
export const getTaskSettings = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from('task_settings').select('*').order('vip_level', { ascending: true });
        if (error) throw error;
        
        const mappedData = data.map((s: any) => ({
            ...s,
            total_orders: s.total_orders ?? s.daily_limit,
            min_access_balance: s.min_access_balance ?? s.balance_min,
            fixed_commission: s.fixed_commission ?? s.commission_start // Fallback if needed
        }));

        res.json({ success: true, data: mappedData });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const updateTaskSettings = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = { ...req.body };
        
        // Filter to only columns that exist in the database
        const finalBody: any = {};
        if (body.daily_limit !== undefined) finalBody.daily_limit = body.daily_limit;
        else if (body.total_orders !== undefined) finalBody.daily_limit = body.total_orders;
        
        if (body.balance_min !== undefined) finalBody.balance_min = body.balance_min;
        else if (body.min_access_balance !== undefined) finalBody.balance_min = body.min_access_balance;
        
        if (body.balance_max !== undefined) finalBody.balance_max = body.balance_max;
        if (body.commission_start !== undefined) finalBody.commission_start = body.commission_start;
        else if (body.fixed_commission !== undefined) finalBody.commission_start = body.fixed_commission;
        
        if (body.commission_end !== undefined) finalBody.commission_end = body.commission_end;
        if (body.randomization_pct !== undefined) finalBody.randomization_pct = body.randomization_pct;
        if (body.vip_level !== undefined) finalBody.vip_level = body.vip_level;

        const { data, error } = await supabase.from('task_settings').update(finalBody).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// --- PRODUCT LIBRARY ---
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        const mappedData = data.map((p: any) => ({
            ...p,
            price: p.price !== undefined ? p.price : p.price_range_min,
            commission: p.commission !== undefined ? p.commission : p.price_range_max
        }));

        res.json({ success: true, data: mappedData });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const addProduct = async (req: Request, res: Response) => {
    try {
        const body = { ...req.body };
        
        // Use new names if they exist, otherwise fallback for migration
        const finalBody: any = {
            name: body.name,
            description: body.description,
            image_url: body.image_url,
            category: body.category,
            vip_level: body.vip_level,
            is_combo_item: body.is_combo_item
        };

        // Resiliency: try to use 'price' and 'commission' first
        finalBody.price = body.price;
        finalBody.commission = body.commission;

        const { data, error } = await supabase.from('products').insert(finalBody).select().single();
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = { ...req.body };
        
        // Map new names to old column names
        const finalBody: any = {};
        if (body.name !== undefined) finalBody.name = body.name;
        if (body.description !== undefined) finalBody.description = body.description;
        if (body.image_url !== undefined) finalBody.image_url = body.image_url;
        if (body.category !== undefined) finalBody.category = body.category;
        if (body.vip_level !== undefined) finalBody.vip_level = body.vip_level;
        if (body.is_combo_item !== undefined) finalBody.is_combo_item = body.is_combo_item;
        
        // Update with new field names (price, commission)
        if (body.price !== undefined) finalBody.price = body.price;
        if (body.commission !== undefined) finalBody.commission = body.commission;

        const { data, error } = await supabase.from('products').update(finalBody).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// --- SUPPORT CHAT ---
export const getThreads = async (req: Request, res: Response) => {
  try {
    let { data: threads, error } = await supabase
      .from('support_threads')
      .select('*, users(username, vip_level, balance)')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.warn("Failed to fetch threads with users relationship, falling back to manual join:", error.message);
      // Fallback: Fetch threads and users separately
      const { data: rawThreads, error: threadError } = await supabase
        .from('support_threads')
        .select('*')
        .order('last_message_at', { ascending: false });
      
      if (threadError) throw threadError;
      
      const userIds = rawThreads.map(t => t.user_id);
      const { data: users } = await supabase.from('users').select('id, username, vip_level').in('id', userIds);
      
      threads = rawThreads.map(t => ({
        ...t,
        users: users?.find(u => u.id === t.user_id) || { username: 'Unknown', vip_level: 1 }
      }));
    }

    res.json({ success: true, data: threads });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getThreadMessages = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    console.log(`[Support] Fetching messages for thread: ${threadId}`);
    
    // 1. Get the thread to find the user_id (for fallback)
    const { data: thread, error: threadError } = await supabase
      .from('support_threads')
      .select('user_id')
      .eq('id', threadId)
      .maybeSingle();

    if (threadError) {
      console.error("[Support] Error fetching thread:", threadError.message);
      throw threadError;
    }
    
    if (!thread) {
      console.error("[Support] Thread not found for ID:", threadId);
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    // 2. Try fetching with thread_id
    let { data: messages, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error && (error.message.includes('thread_id') || error.code === 'PGRST204' || error.code === '42703')) {
      console.warn("[Support] Falling back to fetching messages by user_id:", error.message);
      // Fallback: Use user_id and map sender to sender_type
      const { data: rawMessages, error: msgError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', thread.user_id)
        .order('created_at', { ascending: true });
        
      if (msgError) {
        console.error("[Support] Fallback messages fetch failed:", msgError.message);
        throw msgError;
      }
      
      messages = (rawMessages || []).map((m: any) => ({
        ...m,
        thread_id: threadId,
        sender_type: m.sender || (m.sender_id ? 'user' : 'admin'), // Map old sender field
        message: m.message
      }));
    } else if (error) {
      console.error("[Support] Primary messages fetch failed:", error.message);
      throw error;
    }

    console.log(`[Support] Found ${messages?.length || 0} messages`);

    // Mark messages as read (sender_type or sender)
    try {
      const { error: probeError } = await supabase.from('support_messages').select('thread_id').limit(1);
      const hasNewSchema = !probeError || (probeError.code !== '42703' && !probeError.message.includes('thread_id'));

      if (hasNewSchema) {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('thread_id', threadId)
          .eq('sender_type', 'user');
      } else {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('user_id', thread.user_id)
          .eq('sender', 'user');
      }
    } catch (e) {
      console.warn("[Support] Failed to mark messages as read (non-critical):", e);
    }

    // Reset unread count for admin
    await supabase
      .from('support_threads')
      .update({ unread_admin_count: 0 })
      .eq('id', threadId);

    res.json({ success: true, data: messages || [] });
  } catch (error: any) {
    console.error("[Support] GET_THREAD_MESSAGES_CRASH:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendAdminMessage = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { message, attachmentUrl } = req.body;

    if (!message && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    // 1. Get thread to find user_id
    const { data: thread } = await supabase
      .from('support_threads')
      .select('user_id, unread_user_count')
      .eq('id', threadId)
      .single();

    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    // 2. Create message
    const messagePayload: any = {
      message,
      attachment_url: attachmentUrl
    };

    // Try to determine which columns exist
    const { error: probeError } = await supabase.from('support_messages').select('thread_id').limit(1);
    const hasThreadId = !probeError || (probeError.code !== '42703' && !probeError.message.includes('thread_id'));

    if (hasThreadId) {
      messagePayload.thread_id = threadId;
      messagePayload.sender_type = 'admin';
      messagePayload.sender_id = null;
    } else {
      messagePayload.user_id = thread.user_id;
      messagePayload.sender = 'admin';
    }

    const { data: newMessage, error } = await supabase
      .from('support_messages')
      .insert(messagePayload)
      .select()
      .single();

    if (error) throw error;

    // 3. Update thread
    await supabase
      .from('support_threads')
      .update({
        last_message_at: new Date(),
        unread_user_count: (thread.unread_user_count || 0) + 1
      })
      .eq('id', threadId);

    // 4. Emit via Socket.io to User
    const io = req.app.get('io');
    io.to(thread.user_id).emit('receive_support_message', newMessage);

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const resolveThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { status } = req.body; // 'open' or 'resolved'

    const { data, error } = await supabase
      .from('support_threads')
      .update({ status })
      .eq('id', threadId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    
    // 1. Get thread info for cleanup
    const { data: thread } = await supabaseAdmin.from('support_threads').select('user_id').eq('id', threadId).single();

    // 2. Cascade delete messages
    if (thread) {
      // Delete by thread_id if column exists
      await supabaseAdmin.from('support_messages').delete().eq('thread_id', threadId);
      // Fallback: Delete by user_id for legacy compatibility
      await supabaseAdmin.from('support_messages').delete().eq('user_id', thread.user_id);
    }

    // 3. Delete the thread itself
    const { error } = await supabaseAdmin
      .from('support_threads')
      .delete()
      .eq('id', threadId);

    if (error) throw error;

    res.json({ success: true, message: 'Thread permanently removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// --- LEVEL APPROVALS ---
export const getLevelRequests = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        users (
          id,
          username,
          vip_level,
          balance
        )
      `)
      .eq('type', 'deposit')
      .eq('admin_remarks', 'VIP_UNLOCK_REQUEST')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to frontend expected format
    const requests = (data || []).map((tx: any) => ({
      _id: tx.users.id,
      username: tx.users.username,
      vipLevel: tx.users.vip_level,
      balance: tx.users.balance,
      vipLevelRequest: tx.amount, // Level stored in amount
      transactionId: tx.id // Keep for approval
    }));

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};


export const approveLevelUnlock = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { level, action } = req.body; // action: 'approved' or 'rejected'

    // 1. Update the transaction status
    const { error: txError } = await supabase
      .from('transactions')
      .update({ status: action })
      .eq('user_id', userId)
      .eq('type', 'deposit')
      .eq('admin_remarks', 'VIP_UNLOCK_REQUEST')
      .eq('status', 'pending');

    if (txError) throw txError;

    // 2. If approved, update user's main vip_level and RESET tasks
    if (action === 'approved') {
      const { error: userError } = await supabase
        .from('users')
        .update({
          vip_level: level,
          updated_at: new Date()
        })
        .eq('id', userId);
        
      if (userError) throw userError;
    }

    res.json({ success: true, message: `Level ${level} ${action}` });
  } catch (error) {
    console.error("APPROVE LEVEL ERROR:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    console.log(`--- ADMIN: DELETING USER ${userId} ---`);

    // 1. Delete associated data first
    await supabaseAdmin.from('transactions').delete().eq('user_id', userId);
    await supabaseAdmin.from('combos').delete().eq('user_id', userId);
    await supabaseAdmin.from('support_messages').delete().eq('user_id', userId);
    await supabaseAdmin.from('support_threads').delete().eq('user_id', userId);

    // 2. Delete from public.users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userError) {
      console.warn('--- ADMIN: USER DELETE WARNING ---', userError.message);
    }

    // 3. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.warn('--- ADMIN: AUTH DELETE WARNING ---', authError.message);
    }

    res.json({ success: true, message: 'User deleted completely from system' });
  } catch (error) {
    console.error('--- ADMIN: DELETE USER FAIL ---', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCombo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`--- ADMIN: DELETING COMBO ${id} ---`);

    const { error } = await supabaseAdmin
      .from('combos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Combo deleted successfully' });
  } catch (error) {
    console.error('DELETE COMBO ERROR:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
