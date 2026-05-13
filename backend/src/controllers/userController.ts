import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/db';
import { calculateProgressiveCommission } from '../utils/progressiveCommission';

const mapTaskToCamelCase = (task: any) => {
  if (!task) return null;
  return {
    id: task.id,
    userId: task.user_id,
    taskNumber: task.task_number,
    productName: task.product_name,
    productImage: task.product_image,
    price: Number(task.price),
    commission: Number(task.commission),
    status: task.status,
    comboId: task.combo_id,
    products: task.products,
    createdAt: task.created_at
  };
};

// Helper: Get UTC midnight for a given date
const getUTCMidnight = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

// @desc    Get user profile & dashboard data
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const user = req.user; 
    console.log(`--- FETCHING PROFILE FOR: ${user.username} (ID: ${userId}) ---`);
    // Fetch pending task if any
    let pendingTask: any = null;
    if (user.pending_task) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', user.pending_task)
        .single();
      pendingTask = mapTaskToCamelCase(taskData);
    }

    // Ensure user has an invite code
    let inviteCode = user.invite_code;
    if (!inviteCode) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from('users').update({ invite_code: inviteCode }).eq('id', userId);
    }

    const todayUTC = getUTCMidnight(new Date());

    // --- CALCULATE EARNINGS ---
    const todayStart = new Date(todayUTC);
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString());

    const { data: yesterdayTasks } = await supabase
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', todayStart.toISOString());

    const todayEarning = todayTasks?.reduce((sum, t) => sum + Number(t.commission), 0) || 0;
    const yesterdayEarning = yesterdayTasks?.reduce((sum, t) => sum + Number(t.commission), 0) || 0;

    // Fetch latest pending unlock request (for frontend badge)
    const { data: latestTx } = await supabase
      .from('transactions')
      .select('amount, status, created_at')
      .eq('user_id', userId)
      .eq('type', 'deposit')
      .eq('admin_remarks', 'VIP_UNLOCK_REQUEST')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      success: true,
      data: {
        _id: user.id,
        username: user.username,
        role: user.role,
        balance: user.balance,
        vipLevel: user.vip_level,
        completedTasksToday: user.completed_tasks_today,
        totalDeposited: user.total_deposited,
        totalWithdrawn: user.total_withdrawn,
        totalCommission: user.total_commission,
        todayEarning,
        yesterdayEarning,
        currentSessionCommission: user.current_session_commission || 0,
        isTaskLocked: user.is_task_locked || false,
        inviteCode,
        avatar: user.avatar,
        withdrawalAddress: user.withdrawal_address,
        vipLevelRequest: latestTx?.amount || 0,
        vipLevelRequestStatus: latestTx?.status || 'none',
        pendingTask
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Generate next task (or combo)
export const generateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const user = req.user; // Use the already corrected user from middleware

    // All 60 tasks done for today
    if (user.completed_tasks_today >= 60) {
      return res.status(400).json({
        success: false,
        message: 'You have completed all your levels for today. Come back after 24 hours!'
      });
    }

    // Determine which level user is currently on (1, 2, or 3)
    const currentLevel = Math.floor(user.completed_tasks_today / 20) + 1;

    if (currentLevel > 3) {
      return res.status(400).json({
        success: false,
        message: 'You have completed all your levels for today. Come back after 24 hours!'
      });
    }



    // Return existing pending task if any (idempotent)
    if (user.pending_task) {
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', user.pending_task)
        .single();
      return res.json({ success: true, data: mapTaskToCamelCase(existingTask) });
    }

    // Admin approval check: user's vip_level must cover the current level
    if (user.vip_level < currentLevel) {
      return res.status(403).json({
        success: false,
        message: `VIP Level ${currentLevel} is not yet approved. Please request an unlock.`,
        code: 'LEVEL_NOT_APPROVED'
      });
    }





    // Fetch task settings for current level
    const { data: settings } = await supabase
      .from('task_settings')
      .select('*')
      .eq('vip_level', currentLevel)
      .single();

    if (!settings) {
      return res.status(500).json({
        success: false,
        message: `Task settings for VIP ${currentLevel} not configured`
      });
    }

    // Minimum balance check for this level
    if (user.balance < Number(settings.min_access_balance)) {
      return res.status(403).json({
        success: false,
        message: `Minimum balance of $${settings.min_access_balance} required to access orders`,
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    if (user.is_task_locked) {
      return res.status(403).json({
        success: false,
        message: 'Your task access has been locked by admin'
      });
    }

    const nextTaskNumber = (user.completed_tasks_today || 0) + 1;

    // Fetch product pool for CURRENT level with anti-repetition
    let recentIds = user.recently_shown_products || [];
    let query = supabase.from('products').select('*').eq('vip_level', currentLevel);

    if (recentIds.length > 0 && Array.isArray(recentIds)) {
      query = query.not('id', 'in', `(${recentIds.join(',')})`);
    }

    let { data: productPool, error: poolError } = await query;

    if (poolError || !productPool || productPool.length === 0) {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vip_level', currentLevel);

      if (!count || count === 0) {
        return res.status(400).json({
          success: false,
          message: `No products found for VIP ${currentLevel}. Please contact admin.`
        });
      }

      // Product pool exhausted due to recentIds — reset and re-fetch
      await supabase.from('users').update({ recently_shown_products: [] }).eq('id', userId);
      const { data: resetPool } = await supabase.from('products').select('*').eq('vip_level', currentLevel);
      productPool = resetPool;
      recentIds = [];
    }

    // Schema resilience mapping
    productPool = productPool!.map((p: any) => ({
      ...p,
      price: p.price !== undefined ? p.price : p.price_range_min,
      commission: p.commission !== undefined ? p.commission : p.price_range_max
    }));

    // Auto-schedule combos at start of day (task #1)
    if (nextTaskNumber === 1) {
      const { data: existingCombos } = await supabase
        .from('combos')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'scheduled');

      if (!existingCombos || existingCombos.length === 0) {
        const comboCount = Number(settings.combo_count || 0);
        if (comboCount > 0) {
          const totalOrders = Number(settings.total_orders);
          const positions: number[] = [];
          while (positions.length < comboCount) {
            const pos = Math.floor(Math.random() * (totalOrders - 2)) + 2;
            if (!positions.includes(pos)) positions.push(pos);
          }

          const comboItems = productPool.filter((p: any) => p.is_combo_item);
          if (comboItems.length >= 3) {
            for (const pos of positions) {
              const selectedComboProducts = [...comboItems].sort(() => 0.5 - Math.random()).slice(0, 3);
              const totalPrice = selectedComboProducts.reduce((sum, p) => sum + Number(p.price), 0);
              const totalComm = selectedComboProducts.reduce((sum, p) => sum + Number(p.commission), 0);

              await supabase.from('combos').insert({
                user_id: userId,
                position: pos,
                items_count: 3,
                price: totalPrice,
                commission: totalComm,
                status: 'scheduled'
              });
            }
          }
        }
      }
    }

    // Check for combo at this position (Level-relative: 1-20)
    const relativePosition = ((nextTaskNumber - 1) % 20) + 1;
    
    const { data: combo } = await supabaseAdmin
      .from('combos')
      .select('*')
      .eq('user_id', userId)
      .eq('position', relativePosition)
      .in('status', ['scheduled', 'active'])
      .maybeSingle();

    let taskData: any = {
      user_id: userId,
      task_number: nextTaskNumber,
      status: 'pending',
    };

    let selectedProducts: any[] = [];

    if (combo) {
      taskData.price = combo.price;
      taskData.commission = combo.commission;
      taskData.combo_id = combo.id;

      const comboPool = productPool.filter((p: any) => p.is_combo_item);
      const shuffled = [...(comboPool.length >= 3 ? comboPool : productPool)].sort(() => 0.5 - Math.random());
      selectedProducts = shuffled.slice(0, 3);

      await supabase.from('combos').update({ status: 'active' }).eq('id', combo.id);
    } else {
      const affordableProducts = productPool
        .filter((p: any) => !p.is_combo_item)
        .filter((p: any) => p.price <= user.balance);

      if (affordableProducts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No affordable products found for your current balance. Please recharge.'
        });
      }

      const randomProduct = affordableProducts[Math.floor(Math.random() * affordableProducts.length)];
      selectedProducts = [randomProduct];

      taskData.price = Number(randomProduct.price);

      const baseCommission = Number(randomProduct.commission || 0);
      taskData.commission = nextTaskNumber === Number(settings.total_orders)
        ? baseCommission + Number(settings.fixed_commission)
        : baseCommission;
    }

    taskData.product_name = selectedProducts.map((p: any) => p.name).join(' + ');
    taskData.product_image = selectedProducts.map((p: any) => p.image_url).join('|');

    const { error: productsProbeError } = await supabase.from('tasks').select('products').limit(1);
    if (!productsProbeError) {
      taskData.products = selectedProducts;
    } else {
      console.warn("--- TASK SCHEMA MISSING: skipping 'products' JSONB column ---");
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) throw taskError;

    const updatePayload: any = { pending_task: task.id };

    const { error: recentProbe } = await supabase.from('users').select('recently_shown_products').limit(1);
    if (!recentProbe) {
      updatePayload.recently_shown_products = [...recentIds, ...selectedProducts.map((p: any) => p.id)].slice(-20);
    }

    await supabase.from('users').update(updatePayload).eq('id', userId);

    res.json({ success: true, data: mapTaskToCamelCase(task) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Complete current task
export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const user = req.user; // Use already corrected user from middleware

    // 1. Fetch FRESH user data from database to prevent stale counter issues
    const { data: freshUser, error: freshError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (freshError || !freshUser) throw new Error('Failed to retrieve fresh user state');

    if (!freshUser.pending_task) {
      return res.status(400).json({ success: false, message: 'No pending task found in profile' });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', freshUser.pending_task)
      .single();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (freshUser.balance < task.price) {
      const required = (Number(task.price) - Number(freshUser.balance)).toFixed(2);
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You need to deposit at least $${required} to complete this task.`
      });
    }

    // 2. Perform the update
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id);

    const newBalance = Number(freshUser.balance) + Number(task.commission);
    const newTotalCommission = Number(freshUser.total_commission) + Number(task.commission);
    const newSessionCommission = Number(freshUser.current_session_commission || 0) + Number(task.commission);
    const newCompletedTasks = Number(freshUser.completed_tasks_today || 0) + 1;

    console.log(`--- TASK COMPLETION: User ${freshUser.username}, Progress: ${freshUser.completed_tasks_today} -> ${newCompletedTasks} ---`);

    const updateData: any = {
      balance: newBalance,
      total_commission: newTotalCommission,
      completed_tasks_today: newCompletedTasks,
      pending_task: null
    };

    const { error: commProbeError } = await supabase.from('users').select('current_session_commission').limit(1);
    if (!commProbeError) {
      updateData.current_session_commission = newSessionCommission;
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;


    if (task.combo_id) {
      await supabase.from('combos').update({ status: 'completed' }).eq('id', task.combo_id);
    }

    const camelUser = {
      _id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      balance: updatedUser.balance,
      vipLevel: updatedUser.vip_level,
      completedTasksToday: updatedUser.completed_tasks_today,
      totalDeposited: updatedUser.total_deposited,
      totalWithdrawn: updatedUser.total_withdrawn,
      totalCommission: updatedUser.total_commission,
      inviteCode: updatedUser.invite_code,
    };

    res.json({
      success: true,
      data: {
        user: camelUser,
        completedTask: mapTaskToCamelCase({ ...task, status: 'completed' })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Submit deposit
export const submitDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, screenshot } = req.body;

    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user._id,
        type: 'deposit',
        amount,
        net_amount: amount,
        screenshot,
        status: 'pending'
      })
      .select()
      .single();

    if (txnError) throw txnError;

    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_deposit', {
        user: req.user.username,
        amount,
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('DEPOSIT ERROR:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get user transaction history
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Submit withdrawal request
export const submitWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, address } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance, withdrawal_address')
      .eq('id', userId)
      .single();
      
    console.log(`--- WITHDRAW ATTEMPT: User ID ${userId}, Found: ${!!user}, Error: ${userError?.message || 'none'} ---`);

    if (userError || !user) throw new Error('User not found');

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const fee = Number(amount) * 0.05;
    const netAmount = Number(amount) - fee;

    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        net_amount: netAmount,
        wallet_address: address,
        status: 'pending'
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Balance is NOT deducted here. It is only deducted when admin APPROVES the request.
    // This prevents users gaming the system, and lets admin reject without any balance side-effects.
    if (!user.withdrawal_address && address) {
      await supabaseAdmin.from('users').update({ withdrawal_address: address }).eq('id', userId);
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_withdrawal', {
        user: req.user.username,
        amount,
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('WITHDRAWAL ERROR:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Update user avatar
export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { avatar } = req.body;
    const userId = req.user._id;

    const { data, error } = await supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: { avatar: data.avatar } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Update user withdrawal address
export const updateWithdrawalAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.body;
    const userId = req.user._id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('withdrawal_address')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');
    if (user.withdrawal_address) {
      return res.status(400).json({ success: false, message: 'Withdrawal address already set' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ withdrawal_address: address })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: { withdrawalAddress: data.withdrawal_address } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get all task settings
export const getTaskSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('task_settings')
      .select('*')
      .order('vip_level', { ascending: true });
    
    console.log(`--- TASK SETTINGS FETCHED: ${data?.length || 0} rows, Error: ${error?.message || 'none'} ---`);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Select a room (VIP Level) to start tasks
// FIXED: Now checks admin approval before allowing room entry
export const selectRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { vipLevel } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, vip_level, completed_tasks_today')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');

    // Check balance requirement
    const { data: settings } = await supabase
      .from('task_settings')
      .select('balance_min')
      .eq('vip_level', vipLevel)
      .single();

    if (!settings) throw new Error('Room settings not found');

    if (Number(user.balance) < Number(settings.balance_min)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient balance for VIP ${vipLevel}. Minimum $${settings.balance_min} required.`
      });
    }

    // FIXED: Admin approval check — user.vip_level tracks approved level
    if (user.vip_level < vipLevel) {
      return res.status(403).json({
        success: false,
        message: `VIP Level ${vipLevel} has not been approved by admin yet. Please request an unlock.`,
        code: 'NOT_APPROVED'
      });
    }

    // Sequential task completion check
    // Cannot enter Level 2 without completing Level 1 tasks (20 tasks)
    // Cannot enter Level 3 without completing Level 2 tasks (40 tasks)
    const requiredTasksToEnter = (vipLevel - 1) * 20;
    if (vipLevel > 1 && user.completed_tasks_today < requiredTasksToEnter) {
      return res.status(403).json({
        success: false,
        message: `Please complete VIP Level ${vipLevel - 1} tasks first (${user.completed_tasks_today}/${requiredTasksToEnter} done).`,
        code: 'PREVIOUS_LEVEL_INCOMPLETE'
      });
    }

    // FIXED: Removed unauthorized vip_level update. 
    // The user's vip_level in the database is the APPROVED level.
    // Entering a room shouldn't update the user's permanent approval level.
    
    res.json({ success: true, message: `Entered VIP ${vipLevel} room successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get user's completed task history
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data.map(mapTaskToCamelCase) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Request VIP level unlock (sends request to admin)
export const requestLevelUnlock = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const user = req.user; // Use the already corrected user from middleware
    const { level } = req.body;

    if (!level || level < 1 || level > 3) {
      return res.status(400).json({ success: false, message: 'Invalid level' });
    }

    // 1. Balance check
    const minBalances: Record<number, number> = { 1: 20, 2: 399, 3: 799 };
    const requiredBalance = minBalances[level] ?? 999999;

    if (user.balance < requiredBalance) {
      return res.status(400).json({
        success: false,
        message: `Minimum balance of $${requiredBalance} required for VIP Level ${level}`
      });
    }

    // 2. Sequential task completion check (fires on click, not visually blocked)
    if (level === 2) {
      if (user.completed_tasks_today < 20) {
        return res.status(400).json({
          success: false,
          message: 'Please complete Level 1 tasks first (20/20 required)'
        });
      }
    }

    if (level === 3) {
      if (user.completed_tasks_today < 20) {
        return res.status(400).json({
          success: false,
          message: 'Please complete Level 1 tasks first (20/20 required)'
        });
      }
      if (user.completed_tasks_today < 40) {
        return res.status(400).json({
          success: false,
          message: 'Please complete Level 2 tasks first (40/40 required)'
        });
      }
    }

    // 3. Already approved check
    if (user.vip_level >= level) {
      return res.status(400).json({
        success: false,
        message: `VIP Level ${level} is already approved for your account`
      });
    }

    // 4. Duplicate pending request check (one request at a time)
    const { data: existingRequest } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'deposit')
      .eq('admin_remarks', 'VIP_UNLOCK_REQUEST')
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending unlock request. Please wait for admin approval.'
      });
    }

    // 5. Create unlock request in transactions table
    const { error: txnError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount: level,       // amount stores the level number (1, 2, or 3)
      net_amount: 0,       // 0 so it doesn't affect balance
      admin_remarks: 'VIP_UNLOCK_REQUEST',
      status: 'pending'
    });

    if (txnError) throw txnError;

    // 6. Notify admin in real time
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_level_request', {
        username: user.username,
        level,
        balance: user.balance
      });
    }

    res.json({
      success: true,
      message: `VIP Level ${level} unlock request submitted. Please wait for admin approval.`
    });
  } catch (error) {
    console.error('VIP REQUEST ERROR:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};