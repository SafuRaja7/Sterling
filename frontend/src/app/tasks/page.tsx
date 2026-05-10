"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, Crown, CheckCircle, X, ShoppingBag, ArrowLeft, Wallet, TrendingUp, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";
import confetti from "canvas-confetti";

export default function Tasks() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [tiers, setTiers] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'rooms' | 'engine'>('rooms');
  const [viewTier, setViewTier] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchTiers();
  }, [token]);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const [tiersRes, profileRes] = await Promise.all([
        api.get("/user/task-settings"),
        api.get("/user/profile")
      ]);
      setTiers(tiersRes.data.data || []);
      useAuthStore.getState().setUser(profileRes.data.data);
    } catch (err) { 
      console.error("Fetch error:", err);
      toast.error("Failed to sync session"); 
    } finally { 
      setLoading(false); 
    }
  };

  const startMatching = async () => {
    const isCompletedTierView = viewTier !== null && viewTier < (user?.vipLevel || 1);
    if (isCompletedTierView || !user || (user.completedTasksToday ?? 0) >= 20) {
      toast.error(isCompletedTierView ? "Daily task limit reached for this level" : "Daily task limit reached. Contact support to refresh task"); return;
    }
    setMatching(true);
    try {
      const { data } = await api.post("/user/task/generate");
      if (data.success) setCurrentTask(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "No tasks available");
    } finally { setMatching(false); }
  };

  const submitTask = async () => {
    if (!currentTask) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/user/task/complete", { taskId: currentTask.id });
      if (data.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#F0D060', '#FFFFFF', '#0D0D0D']
        });
        toast.success(`+$${data.data.completedTask.commission.toFixed(2)} earned!`);
        setCurrentTask(null);
        const profileRes = await api.get("/user/profile");
        useAuthStore.getState().setUser(profileRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSubmitting(false); }
  };

  const handleRequestUnlock = async (level: number) => {
    try {
      const { data } = await api.post("/user/request-level-unlock", { level });
      if (data.success) {
        toast.success("Request submitted! Please contact customer support to unlock this level.", { duration: 5000 });
        fetchTiers(); // Refresh profile to show pending status
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };


  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-bg pb-28 font-sans relative overflow-hidden">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-40 -right-40 opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      <header className="px-6 pt-12 pb-6 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[rgba(245,245,245,0.4)] mb-1">Daily Operations</p>
        <h1 className="text-3xl font-black tracking-tighter text-[#F5F5F5]">
          Task <span className="text-gold-gradient">Engine</span>
        </h1>
      </header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Premium Earnings Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-glass rounded-[32px] p-6 relative overflow-hidden group"
          style={{ 
            background: "linear-gradient(145deg, rgba(26,26,26,0.9), rgba(13,13,13,0.95))",
            border: "1px solid rgba(212,175,55,0.15)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} className="text-[#D4AF37]" />
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            {/* Total Balance */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">Total Balance</p>
                <h2 className="text-3xl font-black text-[#F5F5F5] tracking-tighter">
                  ${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                <Wallet size={24} className="text-[#D4AF37]" />
              </div>
            </div>

            {/* Earnings Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Today's Earning</p>
                <p className="text-lg font-black text-[#38A169]">
                  +${Number(user.todayEarning || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Yesterday Earning</p>
                <p className="text-lg font-black text-white/80">
                  +${Number(user.yesterdayEarning || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Glow */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D4AF37] blur-[80px] opacity-10 pointer-events-none" />
        </motion.div>

        {view === 'engine' ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <button onClick={() => setView('rooms')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#D4AF37] transition-colors mb-2">
              <ArrowLeft size={14} /> Back to Rooms
            </button>
            
            {/* Progress */}
            <div className="rounded-[24px] p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.15)", borderTop: "2px solid #D4AF37" }}>
              {(() => {
                const isCompletedTierView = viewTier !== null && viewTier < (user.vipLevel || 1);
                const displayTasks = isCompletedTierView ? 20 : (user.completedTasksToday ?? 0);
                const displayVip = viewTier || user.vipLevel || 1;
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.4)]">Today's Progress (VIP {displayVip})</p>
                        <p className="text-2xl font-black text-[#F5F5F5] mt-1">
                          <span className="text-gold-gradient">{displayTasks}</span>
                          <span className="text-[rgba(245,245,245,0.3)] text-lg">/20</span>
                        </p>
                      </div>
                      <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.3)" }}>
                        <Crown size={24} className="text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[#252525] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((displayTasks / 20) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(to right, #A08020, #D4AF37, #F0D060)" }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Active Task */}
            <AnimatePresence>
              {currentTask && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-[32px] p-6 relative"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.3)", boxShadow: "0 0 40px rgba(212,175,55,0.1)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-t-[32px]" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Active Task</p>
                      {currentTask.comboId && (
                        <span className="px-2 py-0.5 rounded bg-[#E53E3E]/20 text-[#E53E3E] text-[8px] font-black uppercase tracking-widest border border-[#E53E3E]/30">Combo Order</span>
                      )}
                    </div>
                    <button onClick={() => setCurrentTask(null)} className="text-[rgba(245,245,245,0.3)] hover:text-[#F5F5F5] transition-colors"><X size={18} /></button>
                  </div>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-3 overflow-x-auto luxury-scrollbar pb-2">
                      {currentTask.products && currentTask.products.length > 0 ? (
                        currentTask.products.map((p: any, idx: number) => (
                          <div key={idx} className="h-20 w-20 rounded-2xl flex-shrink-0 overflow-hidden p-2 bg-[#252525] border border-[#D4AF37]/20 relative">
                            <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                            {currentTask.comboId && (
                              <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black text-[#D4AF37] border border-[#D4AF37]/30">
                                {idx + 1}/{currentTask.products.length}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="h-20 w-20 rounded-2xl flex-shrink-0 overflow-hidden p-2 bg-[#252525] border border-[#D4AF37]/20">
                          <img src={currentTask.productImage} alt="" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-[#F5F5F5] leading-snug mb-3">{currentTask.productName}</h3>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.35)]">Total Price</p>
                          <p className="text-sm font-black text-[#F5F5F5]">${currentTask.price?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.35)]">Total Commission</p>
                          <p className="text-sm font-black text-[#38A169]">+${currentTask.commission?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={submitTask} disabled={submitting} className="btn-gold w-full py-4 rounded-2xl flex items-center justify-center gap-3">
                    {submitting ? <div className="w-5 h-5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" /> : <><CheckCircle size={18} /><span>Complete & Earn</span></>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start Button */}
            {!currentTask && (
              <button onClick={startMatching} disabled={matching}
                className="btn-gold w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-sm disabled:opacity-40"
                style={{ boxShadow: "0 8px 30px rgba(212,175,55,0.3)" }}>
                {matching ? <><div className="w-5 h-5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" /><span>Matching...</span></> : <><Zap size={20} /><span>Start New Task</span></>}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)]">Available Tiers</p>
              <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent ml-4" />
            </div>
          
          <div className="space-y-4">
            {tiers.map((tier, i) => {
              const requiredBalance = tier.min_access_balance || (tier.vip_level === 1 ? 20 : tier.vip_level === 2 ? 399 : 799);
              
              const isApproved = (user.approvedVipLevel || 0) >= tier.vip_level;
              const isPending = user.vipLevelRequest === tier.vip_level && user.vipLevelRequestStatus === 'pending';
              const isRejected = user.vipLevelRequest === tier.vip_level && user.vipLevelRequestStatus === 'rejected';
              
              const isCompleted = tier.vip_level < (user.vipLevel || 1) || (tier.vip_level === user.vipLevel && (user.completedTasksToday ?? 0) >= 20);
              const isCurrentRoom = user.vipLevel === tier.vip_level && !isCompleted && isApproved;

              
              const tierColors: Record<number, string> = {
                1: "#3b82f6", // Blue
                2: "#8b5cf6", // Purple
                3: "#f97316", // Orange
              };
              const accentColor = tierColors[tier.vip_level] || "#D4AF37";
              const commissionRates: Record<number, number> = { 1: 4, 2: 8, 3: 12 };
              const commission = (commissionRates[tier.vip_level] || tier.commission_rate || (tier.vip_level * 0.5 + 2.5)).toFixed(1);

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden luxury-glass rounded-[28px] p-6 group transition-all"
                  style={{ 
                    opacity: isApproved || isCompleted ? 1 : 0.6,
                    borderLeft: isCurrentRoom ? `6px solid ${accentColor}` : isCompleted ? `2px solid #38A169` : isApproved ? `2px solid ${accentColor}` : "1px solid rgba(245,245,245,0.05)",
                    background: isCurrentRoom ? "rgba(255,255,255,0.02)" : undefined
                  }}
                >
                  {/* Ribbon Badge */}
                  <div className="absolute top-0 left-0 px-4 py-1.5 rounded-br-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl z-20"
                    style={{ background: isCompleted ? "#38A169" : isCurrentRoom ? accentColor : isApproved ? `${accentColor}80` : "#252525" }}>
                    {isCompleted ? 'Completed' : isCurrentRoom ? 'Current Room' : `VIP ${tier.vip_level}`}
                  </div>

                  <div className="flex items-center gap-6 mt-4">
                    {/* Left Icon Container */}
                    <div className="relative h-20 w-20 rounded-[22px] bg-white/5 border flex items-center justify-center overflow-hidden group-hover:border-white/20 transition-all"
                      style={{ borderColor: isCurrentRoom ? `${accentColor}50` : "rgba(255,255,255,0.1)" }}>
                      <img src="/images/icons/shopify.png" alt="Shopify" className="w-full h-full object-cover" 
                        style={{ opacity: isApproved ? 1 : 0.3, filter: isApproved ? 'none' : 'grayscale(100%)' }} />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                      <h3 className={`text-lg font-black tracking-tight mb-3 ${isApproved ? "text-white" : "text-white/40"}`}>
                        VIP {tier.vip_level} Shopify
                      </h3>
                      
                      <div className="flex flex-wrap gap-3">
                        {/* Commission Badge */}
                        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2"
                          style={{ background: isApproved ? `${accentColor}15` : "rgba(255,255,255,0.03)", border: `1px solid ${isApproved ? `${accentColor}30` : "rgba(255,255,255,0.05)"}` }}>
                          <span style={{ color: isApproved ? accentColor : "rgba(255,255,255,0.2)" }}>{commission}%</span>
                        </div>

                        {/* Balance Range Badge */}
                        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2"
                          style={{ background: isApproved ? "rgba(212,175,55,0.05)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.15)" }}>
                          <span className={isApproved ? "text-gold-gradient" : "text-white/30"}>
                            ${requiredBalance.toLocaleString()} USDT +
                          </span>
                        </div>
                      </div>
                      
                      {!isCompleted && tier.vip_level > (user.vipLevel || 1) && (
                         <p className="text-[9px] font-bold text-[#E53E3E] mt-3 uppercase tracking-widest">
                           Requires completing VIP {tier.vip_level - 1} tasks
                         </p>
                      )}
                    </div>

                    {isCompleted ? (
                      <button onClick={() => { setViewTier(tier.vip_level); setView('engine'); }} className="h-10 px-4 rounded-full flex items-center justify-center font-black text-[10px] uppercase tracking-widest bg-[#38A169]/20 text-[#38A169] border border-[#38A169]/30 hover:bg-[#38A169]/30 transition-colors">
                        History
                      </button>
                    ) : isApproved ? (
                      <button onClick={() => { setViewTier(tier.vip_level); setView('engine'); }} className="h-10 px-4 rounded-full flex items-center justify-center font-black text-[10px] uppercase tracking-widest bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0D0D0D] transition-colors">
                        Enter
                      </button>
                    ) : isPending ? (
                      <button onClick={() => router.push("/support")} className="h-10 px-4 rounded-full flex items-center justify-center font-black text-[8px] uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all flex-col">
                        <MessageSquare size={10} className="mb-1" />
                        <span>Contact Support</span>
                      </button>
                    ) : tier.vip_level <= (user.vipLevel || 1) ? (
                      <button onClick={() => handleRequestUnlock(tier.vip_level)} className="h-10 px-4 rounded-full flex items-center justify-center font-black text-[10px] uppercase tracking-widest bg-[#D4AF37] text-[#0D0D0D] hover:bg-[#F0D060] transition-colors">
                        Unlock
                      </button>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                        <Lock size={16} className="text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Subtle Background Glow */}
                  {isCurrentRoom && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[80px] opacity-10 pointer-events-none transition-all"
                      style={{ background: accentColor }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}