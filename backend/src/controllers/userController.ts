import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/db';
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

// @desc    Get user profile & dashboard data
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');

    // Fetch pending task if any
    let pendingTask = null;
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

    // --- CALCULATE EARNINGS ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', today.toISOString());

    const { data: yesterdayTasks } = await supabase
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const todayEarning = todayTasks?.reduce((sum, t) => sum + Number(t.commission), 0) || 0;
    const yesterdayEarning = yesterdayTasks?.reduce((sum, t) => sum + Number(t.commission), 0) || 0;


    res.json({ success: true, data: { 
      _id: user.id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      vipLevel: user.vip_level,
      approvedVipLevel: user.approved_vip_level || 0,
      vipLevelRequest: user.vip_level_request || 0,
      vipLevelRequestStatus: user.vip_level_request_status || 'none',
      vipLevelApprovedAt: user.vip_level_approved_at,
      completedTasksToday: user.completed_tasks_today,
      totalDeposited: user.total_deposited,
      totalWithdrawn: user.total_withdrawn,
      totalCommission: user.total_commission,
      todayEarning,
      yesterdayEarning,
      currentSessionCommission: user.current_session_commission,
      isTaskLocked: user.is_task_locked,
      inviteCode: inviteCode,
      avatar: user.avatar,
      withdrawalAddress: user.withdrawal_address,
      pendingTask 
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Generate next task (or combo)
export const generateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.completed_tasks_today >= 20) {
      return res.status(400).json({ success: false, message: 'Session completed for this VIP room. Please wait for the daily reset or recharge to upgrade.' });
    }

    if (user.pending_task) {
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', user.pending_task)
        .single();
      return res.json({ success: true, data: mapTaskToCamelCase(existingTask) });
    }

    // 1. Fetch Task Settings for VIP Level
    const { data: settings } = await supabase
      .from('task_settings')
      .select('*')
      .eq('vip_level', user.vip_level)
      .single();

    if (!settings) return res.status(500).json({ success: false, message: 'Task settings not configured' });

    // --- MANUAL LEVEL APPROVAL CHECK ---
    const approvedLevel = user.approved_vip_level || 0;
    
    if (user.vip_level > approvedLevel) {
      return res.status(403).json({
        success: false,
        message: `VIP Level ${user.vip_level} is not yet approved for tasks. Please request an unlock.`,
        code: 'LEVEL_NOT_APPROVED'
      });
    }

    // --- 24H EXPIRY CHECK FOR VIP 2 & 3 ---
    if (user.vip_level >= 2 && user.vip_level_approved_at) {
      const approvedAt = new Date(user.vip_level_approved_at).getTime();
      const now = new Date().getTime();
      const diffHours = (now - approvedAt) / (1000 * 60 * 60);

      if (diffHours >= 24) {
        // Reset approval if 24h passed
        await supabase.from('users').update({ 
          approved_vip_level: 1, // Reset to Level 1 or 0
          vip_level_request_status: 'none'
        }).eq('id', userId);

        return res.status(403).json({
          success: false,
          message: `Your 24-hour approval for VIP Level ${user.vip_level} has expired. Please request a new unlock.`,
          code: 'APPROVAL_EXPIRED'
        });
      }
    }


    // 1.5. CHECK MIN BALANCE REQUIREMENT
    if (user.balance < Number(settings.min_access_balance)) {
      return res.status(403).json({ 
        success: false, 
        message: `Minimum balance of $${settings.min_access_balance} required to access orders`,
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    if (user.is_task_locked) {
      return res.status(403).json({ success: false, message: 'Your task access has been locked by admin' });
    }

    if (user.completed_tasks_today >= 20) {
      return res.status(400).json({ success: false, message: 'Session completed. Please wait for next cycle or recharge to upgrade.' });
    }

    const nextTaskNumber = user.completed_tasks_today + 1;

    // 2. Fetch Product Pool with Anti-Repetition
    let recentIds = user.recently_shown_products || [];
    let query = supabase.from('products').select('*').eq('vip_level', user.vip_level || 1);
    
    if (recentIds.length > 0) {
      query = query.not('id', 'in', `(${recentIds.join(',')})`);
    }

    let { data: productPool, error: poolError } = await query;

    if (poolError || !productPool || productPool.length === 0) {
      // Check if it's empty because of recentIds or because there are truly no products
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('vip_level', user.vip_level || 1);
      
      if (!count || count === 0) {
        return res.status(400).json({ success: false, message: `No products found for VIP ${user.vip_level}. Please add products in Admin.` });
      }

      // Products exist, so it must be exhausted due to recentIds. Reset and re-fetch.
      await supabase.from('users').update({ recently_shown_products: [] }).eq('id', userId);
      const { data: resetPool } = await supabase.from('products').select('*').eq('vip_level', user.vip_level || 1);
      productPool = resetPool;
      recentIds = [];
    }

    // Map fields for schema resilience
    productPool = productPool!.map((p: any) => ({
      ...p,
      price: p.price !== undefined ? p.price : p.price_range_min,
      commission: p.commission !== undefined ? p.commission : p.price_range_max
    }));

    // 3. Auto-Schedule Combos if it's the start of the day and not yet scheduled
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
          // Generate unique random positions (not the first, not the last)
          const positions: number[] = [];
          while (positions.length < comboCount) {
            const pos = Math.floor(Math.random() * (totalOrders - 2)) + 2;
            if (!positions.includes(pos)) positions.push(pos);
          }

          // Create combo records
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

    // 4. Check for Scheduled or Active Combo at this position
    const { data: combo } = await supabase
      .from('combos')
      .select('*')
      .eq('user_id', userId)
      .eq('position', nextTaskNumber)
      .in('status', ['scheduled', 'active'])
      .maybeSingle();

    let taskData: any = {
      user_id: userId,
      task_number: nextTaskNumber,
      status: 'pending',
    };

    let selectedProducts = [];

    if (combo) {
      taskData.price = combo.price;
      taskData.commission = combo.commission;
      taskData.combo_id = combo.id;
      
      // Select 3 products marked as combo items for this VIP
      const comboPool = productPool.filter((p: any) => p.is_combo_item);
      const shuffled = [...(comboPool.length >= 3 ? comboPool : productPool)].sort(() => 0.5 - Math.random());
      selectedProducts = shuffled.slice(0, 3);

      await supabase.from('combos').update({ status: 'active' }).eq('id', combo.id);
    } else {
      // SINGLE Task Logic - Only use non-combo items
      const affordableProducts = productPool
        .filter(p => !p.is_combo_item)
        .filter(p => p.price <= user.balance);
      
      if (affordableProducts.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No affordable products found for your current balance. Please recharge.' 
        });
      }

      const randomProduct = affordableProducts[Math.floor(Math.random() * affordableProducts.length)];
      selectedProducts = [randomProduct];

      // Price calculation: fixed price as per product setting
      taskData.price = Number(randomProduct.price);

      // Commission calculation: Use product-specific commission
      // If it's the final order, we can still apply the fixed bonus if configured
      let baseCommission = Number(randomProduct.commission || 0);
      
      if (nextTaskNumber === Number(settings.total_orders)) {
        taskData.commission = baseCommission + Number(settings.fixed_commission);
      } else {
        taskData.commission = baseCommission;
      }
    }

    // Snapshot product data into the task
    taskData.product_name = selectedProducts.map(p => p.name).join(' + ');
    taskData.product_image = selectedProducts[0].image_url; // Use first image as thumbnail
    taskData.products = selectedProducts; // JSONB storage

    // 4. Insert Task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) throw taskError;

    // 5. Update User State
    const newRecentIds = [...recentIds, ...selectedProducts.map(p => p.id)].slice(-20);
    await supabase
      .from('users')
      .update({ 
        pending_task: task.id,
        recently_shown_products: newRecentIds
      })
      .eq('id', userId);

    res.json({ success: true, data: mapTaskToCamelCase(task) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Complete current task
export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user || !user.pending_task) {
      return res.status(400).json({ success: false, message: 'No pending task' });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', user.pending_task)
      .single();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (user.balance < task.price) {
      const required = (Number(task.price) - Number(user.balance)).toFixed(2);
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. You need to deposit at least $${required} to complete this task.` 
      });
    }

    // Complete task
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id);

    const newBalance = Number(user.balance) + Number(task.commission);
    const newTotalCommission = Number(user.total_commission) + Number(task.commission);
    const newSessionCommission = Number(user.current_session_commission) + Number(task.commission);
    let newCompletedTasks = user.completed_tasks_today + 1;

    // Auto-Upgrade VIP Level if completed current cycle and have enough balance
    let newVipLevel = user.vip_level;
    if (newCompletedTasks >= 20 && user.vip_level < 3) {
      const { data: nextTier } = await supabase
        .from('task_settings')
        .select('min_access_balance')
        .eq('vip_level', user.vip_level + 1)
        .single();
        
      if (nextTier && newBalance >= nextTier.min_access_balance) {
        newVipLevel = user.vip_level + 1;
        newCompletedTasks = 0; // Reset task counter for the new level
      }
    }

    const { data: updatedUser } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        total_commission: newTotalCommission,
        current_session_commission: newSessionCommission,
        completed_tasks_today: newCompletedTasks,
        vip_level: newVipLevel,
        pending_task: null
      })
      .eq('id', userId)
      .select()
      .single();

    // Update combo status if part of combo
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

    res.json({ success: true, data: { user: camelUser, completedTask: mapTaskToCamelCase({ ...task, status: 'completed' }) } });
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

    // Notify Admin via Socket.io
    const io = req.app.get('io');
    io.to('admin_notifications').emit('new_deposit', {
      user: req.user.username,
      amount,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error("DEPOSIT ERROR:", error);
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

    // 1. Check balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, withdrawal_address')
      .eq('id', userId)
      .single();


    if (userError || !user) throw new Error('User not found');
    
    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // 2. Create transaction
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

    // 3. Deduct balance immediately & Save address if first time
    const updates: any = {
      balance: Number(user.balance) - Number(amount)
    };
    if (!user.withdrawal_address && address) {
      updates.withdrawal_address = address;
    }
    
    await supabase.from('users').update(updates).eq('id', userId);


    // 4. Notify Admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_withdrawal', {
        user: req.user.username,
        amount,
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error("WITHDRAWAL ERROR:", error);
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

// @desc    Get all task settings (public for authenticated users)
export const getTaskSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await supabase.from('task_settings').select('*').order('vip_level', { ascending: true });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Get user's task history
// @desc    Select a room (VIP Level) to start tasks
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

        // Check balance requirement for the new room
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

        // Update user's current VIP level
        await supabase.from('users').update({ vip_level: vipLevel }).eq('id', userId);

        res.json({ success: true, message: `Entered VIP ${vipLevel} room successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

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

// @desc    Request level unlock
export const requestLevelUnlock = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { level } = req.body;

    if (!level || level < 1 || level > 3) {
      return res.status(400).json({ success: false, message: 'Invalid level' });
    }

    // Check if already approved for this level
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) throw new Error('User not found');

    if (user.approved_vip_level >= level) {
      return res.status(400).json({ success: false, message: 'Level already approved' });
    }

    // Update request
    const { error } = await supabase.from('users').update({
      vip_level_request: level,
      vip_level_request_status: 'pending'
    }).eq('id', userId);

    if (error) throw error;

    // Notify admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_level_request', {
        username: user.username,
        level
      });
    }

    res.json({ success: true, message: `Request for VIP ${level} submitted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
