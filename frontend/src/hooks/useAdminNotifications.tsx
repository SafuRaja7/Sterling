import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export interface AdminNotification {
  id: string;
  type: 'deposit' | 'withdrawal' | 'support' | 'level' | 'registration';
  message: string;
  time: Date;
  read: boolean;
}

export function useAdminNotifications() {
  const [pendingFinance, setPendingFinance] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const [pendingLevelRequests, setPendingLevelRequests] = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const addNotification = (type: AdminNotification['type'], message: string) => {
    const newNotif: AdminNotification = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      time: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    
    // Trigger real-time toast
    toast.custom((t: any) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#1A1A1A] shadow-2xl rounded-[20px] pointer-events-auto flex ring-1 ring-[#D4AF37]/30 border border-[#D4AF37]/20`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                type === 'deposit' ? 'bg-green-500/10 text-green-500' :
                type === 'withdrawal' ? 'bg-red-500/10 text-red-500' :
                type === 'registration' ? 'bg-blue-500/10 text-blue-500' :
                'bg-[#D4AF37]/10 text-[#D4AF37]'
              }`}>
                {type === 'deposit' ? '💰' : type === 'withdrawal' ? '💸' : type === 'registration' ? '👤' : '🔔'}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Admin Notification</p>
              <p className="mt-1 text-sm font-bold text-white">{message}</p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 5000 });
  };

  useEffect(() => {
    fetchCounts();

    const financeSub = supabase
      .channel('admin-finance-changes')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'transactions' }, (payload: any) => {
        const tx = payload.new;
        if (tx.status === 'pending') {
           addNotification(tx.type as any, `New ${tx.type} request: $${tx.amount}`);
        }
        fetchCounts();
      })
      .subscribe();

    const supportSub = supabase
      .channel('admin-support-changes')
      .on('postgres_changes' as any, { event: '*', table: 'support_threads' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.unread_admin_count > (payload.old?.unread_admin_count || 0)) {
          addNotification('support', `New message from user in support chat`);
        }
        fetchCounts();
      })
      .subscribe();

    const levelSub = supabase
      .channel('admin-level-changes')
      .on('postgres_changes' as any, { event: 'UPDATE', table: 'users' }, (payload: any) => {
        if (payload.new.vip_level_request_status === 'pending' && payload.old?.vip_level_request_status !== 'pending') {
          addNotification('level', `User ${payload.new.username} requested VIP ${payload.new.vip_level_request} unlock`);
        }
        fetchCounts();
      })
      .subscribe();

    const userSub = supabase
      .channel('admin-user-changes')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'users' }, (payload: any) => {
        addNotification('registration', `New user registered: ${payload.new.username}`);
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(financeSub);
      supabase.removeChannel(supportSub);
      supabase.removeChannel(levelSub);
      supabase.removeChannel(userSub);
    };
  }, []);

  const fetchCounts = async () => {
    try {
      const { count: financeCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: threads } = await supabase
        .from('support_threads')
        .select('unread_admin_count')
        .gt('unread_admin_count', 0);

      const supportCount = threads?.reduce((sum, t) => sum + (t.unread_admin_count || 0), 0) || 0;

      const { count: levelCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('vip_level_request_status', 'pending');

      setPendingFinance(financeCount || 0);
      setUnreadSupport(supportCount);
      setPendingLevelRequests(levelCount || 0);
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    }
  };

  return { pendingFinance, unreadSupport, pendingLevelRequests, notifications, setNotifications };
}
