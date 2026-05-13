"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Lock, Crown, CheckCircle, X, 
  ShoppingBag, ArrowLeft, Wallet, TrendingUp, 
  MessageSquare, AlertCircle, Sparkles, ShoppingCart,
  ArrowRight, ShieldCheck, Clock
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";
import confetti from "canvas-confetti";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F5E0A0 100%)";

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
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    if (!user) return;
    const tierLevel = viewTier || 1;
    const tasksInThisTier = Math.max(0, Math.min(20, user.completedTasksToday - (tierLevel - 1) * 20));
    
    if (tasksInThisTier >= 20) {
      setModalError("Daily task limit reached for this tier. Please advance to the next level or return tomorrow for a fresh cycle."); 
      return;
    }
    
    setMatching(true);
    await new Promise(r => setTimeout(r, 1500));
    
    try {
      const { data } = await api.post("/user/task/generate");
      if (data.success) setCurrentTask(data.data);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "No high-yield opportunities available at this moment.");
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
          origin: { y: 0.5 },
          colors: ['#D4AF37', '#F5E0A0', '#FFFFFF']
        });
        setSuccessMessage(`Operation successful. +$${data.data.completedTask.commission.toFixed(2)} has been credited to your institutional vault.`);
        setCurrentTask(null);
        const profileRes = await api.get("/user/profile");
        useAuthStore.getState().setUser(profileRes.data.data);
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Transaction synchronization failed.");
    } finally { setSubmitting(false); }
  };

  const handleRequestUnlock = async (level: number) => {
    try {
      const { data } = await api.post("/user/request-level-unlock", { level });
      if (data.success) {
        setSuccessMessage("Level upgrade request initiated. Please verify with Support to activate your new high-yield terminal.");
        fetchTiers();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Verification request failed.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/10 border-t-[#D4AF37] animate-spin shadow-[0_0_20px_rgba(212,175,55,0.2)]" />
      </div>
    );
  }

  const tierColors: Record<number, string> = { 1: "#3b82f6", 2: "#8b5cf6", 3: "#f97316" };

  return (
    <div className="min-h-screen bg-[#050505] pb-28 font-sans relative overflow-hidden selection:bg-[#D4AF37]/30">
      {/* Enhanced Yellow Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[100%] h-[50%] bg-[#D4AF37]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent opacity-50" />

      <header className="px-8 pt-16 pb-12 relative z-10 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-1.5 bg-gold-gradient rounded-full shadow-[0_0_10px_#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Tactical Operational Unit</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-lg">
            Order <span className="text-gold-gradient">Matrix</span>
          </h1>
        </div>
        <div className="h-16 w-16 rounded-3xl bg-black/40 border border-[#D4AF37]/20 flex items-center justify-center shadow-2xl backdrop-blur-xl relative group">
           <div className="absolute inset-0 bg-gold-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
           <Sparkles size={28} className="text-[#D4AF37] drop-shadow-[0_0_10px_#D4AF37]" />
        </div>
      </header>

      <main className="px-8 space-y-10 relative z-10">
        
        {/* Elite Stats Container - Saturated with Yellow */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[45px] p-10 relative overflow-hidden group shadow-2xl"
          style={{ background: "rgba(212, 175, 55, 0.05)", border: "1.5px solid rgba(212, 175, 55, 0.2)", backdropFilter: "blur(30px)" }}
        >
          <div className="absolute -right-10 -top-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
            <TrendingUp size={160} className="text-[#D4AF37]" />
          </div>
          
          <div className="flex flex-col gap-10 relative z-10">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40 mb-3">Institutional Vault Balance</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[#D4AF37]">$</span>
                  <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                    {Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
              <div className="h-16 w-16 rounded-3xl bg-gold-gradient flex items-center justify-center shadow-[0_12px_35px_rgba(212,175,55,0.4)] relative">
                <div className="absolute inset-0 bg-white opacity-20" />
                <Wallet size={30} className="text-black relative z-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#38A169] shadow-[0_0_10px_#38A169]" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#38A169]">Cycle Earnings</p>
                </div>
                <span className="text-2xl font-black text-[#38A169] drop-shadow-md">
                  +${Number(user.todayEarning || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Daily Matrix Volume</p>
                </div>
                <span className="text-2xl font-black text-white drop-shadow-md">
                  {user.completedTasksToday}<span className="text-[#D4AF37]/40 text-sm ml-1">/ 60</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {view === 'engine' ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-10">
            <button onClick={() => setView('rooms')} className="h-14 px-8 rounded-2xl bg-white/5 border border-[#D4AF37]/20 flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all shadow-xl">
              <ArrowLeft size={18} /> Return to Rooms
            </button>
            
            {/* Progress Visualization - Yellow Accents */}
            <div className="rounded-[45px] p-10 space-y-8 relative overflow-hidden shadow-2xl" 
              style={{ background: "#0A0A0A", border: "1.5px solid rgba(212, 175, 55, 0.25)", backdropFilter: "blur(20px)" }}>
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Sparkles size={120} className="text-[#D4AF37]" />
              </div>
              
              {(() => {
                const tierLevel = viewTier || 1;
                const tasksInThisTier = Math.max(0, Math.min(20, user.completedTasksToday - (tierLevel - 1) * 20));
                return (
                  <>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Operational Load Level</p>
                        <h3 className="text-3xl font-black text-white mt-2 drop-shadow-md">
                          V{tierLevel} <span className="text-[#D4AF37]/20 mx-1">/</span> {tasksInThisTier}<span className="text-[#D4AF37]/40 text-lg">/20</span>
                        </h3>
                      </div>
                      <div className="h-20 w-20 rounded-[30px] bg-gold-gradient flex items-center justify-center shadow-[0_15px_40px_rgba(212,175,55,0.4)]">
                        <Crown size={36} className="text-black" />
                      </div>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden p-[4px] shadow-inner border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((tasksInThisTier / 20) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full rounded-full bg-gold-gradient shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Active Matrix Order */}
            <AnimatePresence mode="wait">
              {currentTask ? (
                <motion.div 
                  key="task"
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-[50px] p-10 relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)]"
                  style={{ background: "rgba(13, 13, 13, 0.9)", border: "2px solid rgba(212, 175, 55, 0.45)", backdropFilter: "blur(40px)" }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                  
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_5px_15px_rgba(212,175,55,0.1)]">
                        <ShoppingCart size={28} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Secure Order</p>
                        <p className="text-[10px] font-bold text-[#D4AF37]/30 uppercase tracking-[0.2em] mt-1">Asset Verification PASSED</p>
                      </div>
                    </div>
                    {currentTask.comboId && (
                      <div className="px-5 py-2.5 rounded-xl bg-[#E53E3E]/10 border border-[#E53E3E]/40 text-[10px] font-black text-[#E53E3E] uppercase tracking-[0.3em] animate-pulse shadow-lg">
                        Combo Boost Active
                      </div>
                    )}
                  </div>

                  <div className="space-y-10">
                    <div className="flex gap-6 overflow-x-auto pb-6 luxury-scrollbar px-1">
                      {currentTask.productImage?.split('|').map((img: string, idx: number) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={idx} 
                          className="h-44 w-44 rounded-[40px] flex-shrink-0 overflow-hidden p-6 bg-black/60 border border-[#D4AF37]/10 relative group shadow-2xl"
                        >
                          <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl" />
                          <div className="absolute inset-0 bg-gold-gradient opacity-[0.05]" />
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-sm">{currentTask.productName}</h3>
                      <div className="grid grid-cols-2 gap-8 p-8 rounded-[35px] bg-[#D4AF37]/5 border border-[#D4AF37]/15 shadow-inner">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40 mb-2">Market Value</p>
                          <p className="text-2xl font-black text-white drop-shadow-md">${currentTask.price?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#38A169]/40 mb-2">Your Yield</p>
                          <p className="text-2xl font-black text-[#38A169] drop-shadow-md">+${currentTask.commission?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={submitTask} 
                      disabled={submitting} 
                      className="h-24 w-full rounded-[35px] flex items-center justify-center gap-5 bg-gold-gradient text-black font-black uppercase text-lg tracking-[0.4em] shadow-[0_20px_60px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      {submitting ? (
                        <div className="w-8 h-8 rounded-full border-4 border-black/30 border-t-black animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck size={32} className="drop-shadow-lg" />
                          <span className="drop-shadow-md">Execute Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : matching ? (
                <motion.div 
                  key="matching"
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="h-[450px] rounded-[50px] bg-[#0A0A0A] border border-[#D4AF37]/20 flex flex-col items-center justify-center gap-10 relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gold-gradient opacity-[0.05]" />
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 rounded-full border-4 border-dashed border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Zap size={40} className="text-[#D4AF37] drop-shadow-[0_0_15px_#D4AF37]" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-base font-black uppercase tracking-[0.8em] text-[#D4AF37]">Scanning Matrix</p>
                    <p className="text-[11px] font-bold text-[#D4AF37]/30 uppercase tracking-[0.4em]">Establishing high-yield link...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.button 
                  key="start"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={startMatching}
                  className="h-32 w-full rounded-[40px] flex flex-col items-center justify-center bg-gold-gradient shadow-[0_20px_50px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-10 group-hover:opacity-20 transition-opacity" />
                  <span className="text-black font-black uppercase tracking-[0.6em] text-lg relative z-10">Initiate Grab</span>
                  <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.3em] mt-2 group-hover:text-black/80 transition-colors relative z-10">Deploy Yield Generation Protocol</p>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-10">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-6 w-1.5 bg-gold-gradient rounded-full" />
                 <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#D4AF37]">Operational Tiers</p>
              </div>
              <div className="h-[1px] w-24 bg-gold-gradient opacity-30 shadow-[0_0_10px_#D4AF37]" />
            </div>
          
          <div className="space-y-6">
            {tiers.map((tier, i) => {
              const reqBalance = Number(tier.min_access_balance) || (tierVip === 1 ? 20 : tierVip === 2 ? 399 : 799);
              const userVip = Number(user.vipLevel || 0);
              
              // RULE: Only unlocked if user's approved VIP level matches or exceeds this tier AND balance is sufficient
              // For Tier 1, user must be at least Level 1 (approved) to enter.
              const isUnlocked = userVip >= tierVip && user.balance >= reqBalance;
              
              const isPending = Number(user.vipLevelRequest) === tierVip && user.vipLevelRequestStatus === 'pending';
              const tasksDone = Math.max(0, Math.min(20, user.completedTasksToday - (tierVip - 1) * 20));
              const isComp = tasksDone >= 20;
              const accent = tierColors[tierVip] || "#D4AF37";
              
              // RULE: Prerequisite tasks (20 per level) must be finished before the UNLOCK button for the next level appears
              const prevLevelTasksRequired = (tierVip - 1) * 20;
              const hasFinishedPrevLevel = tierVip === 1 || user.completedTasksToday >= prevLevelTasksRequired;
              const isEligible = !isUnlocked && !isPending && user.balance >= reqBalance && hasFinishedPrevLevel;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    if (isUnlocked && !isComp) {
                      setViewTier(tierVip);
                      setView('engine');
                    } else if (isEligible) {
                      handleRequestUnlock(tierVip);
                    }
                  }}
                  className={`relative overflow-hidden rounded-[45px] p-10 border transition-all duration-700 shadow-2xl ${
                    isUnlocked ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 cursor-pointer hover:bg-[#D4AF37]/10 hover:translate-x-2" : 
                    isPending ? "bg-blue-500/5 border-blue-500/20 opacity-90" :
                    isEligible ? "bg-white/5 border-white/20 cursor-pointer hover:border-[#D4AF37]/40" :
                    "bg-black/60 border-white/5 grayscale opacity-30 cursor-not-allowed"
                  }`}
                  style={{ 
                    boxShadow: isUnlocked ? "0 25px 50px -12px rgba(212, 175, 55, 0.25)" : "none"
                  }}
                >
                  <div className="absolute -right-8 -top-8 p-10 opacity-[0.04] group-hover:scale-110 transition-transform">
                    <Crown size={120} style={{ color: accent }} />
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8">
                      <div className="h-24 w-24 rounded-[32px] bg-black/60 border border-[#D4AF37]/20 flex items-center justify-center p-5 relative shadow-xl backdrop-blur-md">
                        <div className="absolute inset-0 bg-gold-gradient opacity-10" />
                        <img src="/images/icons/shopify.png" alt="" className="w-full h-full object-contain relative z-10" />
                        {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-[32px] z-20"><Lock size={32} className="text-[#D4AF37]/40" /></div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">Tier V{tier.vip_level}</h3>
                          {isComp && <div className="h-6 w-6 rounded-full bg-[#38A169] flex items-center justify-center text-white shadow-lg shadow-[#38A169]/30"><CheckCircle size={16} /></div>}
                        </div>
                        <div className="flex gap-4">
                          <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                            Yield: <span style={{ color: accent }}>{(tier.vip_level * 0.5 + 2.5).toFixed(1)}%</span>
                          </div>
                          <div className="px-4 py-1.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest shadow-lg">
                            Threshold: ${reqBalance}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {isComp ? (
                        <div className="h-14 w-14 rounded-2xl bg-[#38A169]/10 flex items-center justify-center text-[#38A169] border border-[#38A169]/30 shadow-xl">
                          <CheckCircle size={28} />
                        </div>
                      ) : isUnlocked ? (
                        <button className="h-16 px-10 rounded-2xl bg-gold-gradient text-black flex items-center justify-center font-black uppercase text-[12px] tracking-[0.3em] shadow-[0_15px_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all">
                          Enter Room
                        </button>
                      ) : isPending ? (
                        <div className="h-16 px-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">
                          Awaiting Admin
                        </div>
                      ) : isEligible ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRequestUnlock(tierVip); }}
                          className="h-16 px-10 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-black uppercase text-[12px] tracking-[0.3em] hover:bg-gold-gradient hover:text-black hover:border-transparent transition-all duration-300 shadow-xl"
                        >
                          Unlock
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3 w-full">
                          <div className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white/20 flex items-center justify-center font-black uppercase text-[10px] tracking-[0.2em] shadow-inner">
                            {user.balance < reqBalance ? "Locked: $"+reqBalance : "Prerequisite"}
                          </div>
                          {user.balance < reqBalance && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); router.push('/deposit'); }}
                              className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em] hover:underline transition-all"
                            >
                              Recharge to Unlock →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        )}
      </main>

      <BottomNav />

      {/* Global Center-Screen Premium Modals */}
      <AnimatePresence>
        {(modalError || successMessage) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.85, y: 30 }}
              className={`w-full max-w-sm rounded-[60px] p-12 text-center relative overflow-hidden border shadow-[0_40px_100px_rgba(0,0,0,0.8)] ${
                modalError ? 'bg-[#0D0D0D] border-[#E53E3E]/30' : 'bg-[#0D0D0D] border-[#D4AF37]/30'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gold-gradient opacity-40 shadow-[0_0_20px_#D4AF37]" />
              
              <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center mx-auto mb-10 border shadow-2xl ${
                modalError ? 'bg-[#E53E3E]/10 border-[#E53E3E]/30 text-[#E53E3E]' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
              }`}>
                {modalError ? <AlertCircle size={56} /> : <CheckCircle size={56} />}
              </div>

              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-md">
                {modalError ? 'System Protocol Error' : 'Transaction Success'}
              </h3>
              <p className="text-[14px] font-medium text-white/40 leading-relaxed mb-12 px-6 uppercase tracking-wide">
                {modalError || successMessage}
              </p>

              <div className="flex flex-col gap-5">
                {modalError?.toLowerCase().includes("balance") && (
                  <button 
                    onClick={() => { setModalError(null); router.push("?chat=true"); }}
                    className="h-18 w-full rounded-[25px] bg-gold-gradient text-black font-black uppercase text-[12px] tracking-[0.3em] shadow-[0_15px_40px_rgba(212,175,55,0.4)] flex items-center justify-center gap-4 active:scale-95 transition-all"
                  >
                    <MessageSquare size={20} />
                    Consult Support
                  </button>
                )}
                <button 
                  onClick={() => { setModalError(null); setSuccessMessage(null); }}
                  className="h-18 w-full rounded-[25px] bg-white/5 border border-white/10 text-white font-black uppercase text-[12px] tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95"
                >
                  Dismiss Protocol
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .bg-gold-gradient { background: ${GOLDEN_GRADIENT}; }
        .luxury-scrollbar::-webkit-scrollbar { height: 4px; }
        .luxury-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .luxury-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.4); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function LayoutDashboard(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}