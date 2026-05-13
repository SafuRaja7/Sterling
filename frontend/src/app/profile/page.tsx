"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Settings, LogOut, Crown, Copy, ChevronRight, HelpCircle,
  User, Lock, MessageSquare, Gift, Activity, Camera, CreditCard,
  ShieldCheck, Wallet, History, AlertCircle, CheckCircle, Sparkles
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F5E0A0 100%)";

export default function Profile() {
  const router = useRouter();
  const { user, token, logout, setUser, _hasHydrated } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_hasHydrated) {
      if (!token) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [_hasHydrated, token, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/tasks"),
      ]);
      setUser(profileRes.data.data);
      setTasks(historyRes.data.data || []);
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      if (err.response?.status === 401) {
        setModalError("Identity synchronization failed. Terminal access suspended.");
        logout(); router.push("/login");
      }
    } finally { setLoading(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code secured", { position: "top-center" });
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError("Invalid protocol. Please select an image-based identity file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalError("Data volume exceeds limit. Identity files must be under 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const imageUrl = uploadRes.data.url;
        const updateRes = await api.put('/user/avatar', { avatar: imageUrl });
        if (updateRes.data.success) {
          setUser({ ...user, avatar: imageUrl } as any);
          setSuccessMessage("Identity visual updated. Biometric synchronization complete.");
        }
      }
    } catch (err: any) {
      setModalError("Identity update failed. Connection to core servers was interrupted.");
    } finally {
      setUploading(false);
    }
  };

  const menuItems = [
    { icon: ShieldCheck, label: "Institutional Security", path: "/security" },
    { icon: Wallet, label: "Vault Destinations", path: "/wallet-address" },
    { icon: MessageSquare, label: "Support Terminal", path: "/dashboard?chat=true" },
    { icon: HelpCircle, label: "Knowledge Base", path: "/faq" },
    { icon: Settings, label: "Platform Identity", path: "/platform-profile" },
  ];

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/10 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-32 font-sans relative overflow-hidden">
      {/* Enhanced Yellow Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[100%] h-[50%] bg-[#D4AF37]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-20%] w-[80%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent opacity-50 shadow-[0_0_10px_#D4AF37]" />

      {/* Header Bar */}
      <header className="px-8 pt-16 pb-8 flex items-center justify-between relative z-10">
        <button onClick={() => router.back()} className="h-14 w-14 rounded-3xl bg-white/5 border border-[#D4AF37]/20 flex items-center justify-center hover:bg-[#D4AF37]/10 transition-all shadow-xl backdrop-blur-md">
          <ArrowLeft size={24} className="text-[#D4AF37]/60" />
        </button>
        <div className="text-center">
           <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles size={12} className="text-[#D4AF37]" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Identity Suite</p>
           </div>
           <h1 className="text-lg font-black uppercase tracking-[0.3em] text-white drop-shadow-md">Member <span className="text-[#D4AF37]">Profile</span></h1>
        </div>
        <div className="h-14 w-14" />
      </header>

      <main className="px-8 space-y-10 relative z-10">
        
        {/* Elite Identity Card - Saturated Yellow */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[50px] p-12 relative overflow-hidden group shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          style={{ background: "rgba(212, 175, 55, 0.05)", border: "2px solid rgba(212, 175, 55, 0.25)", backdropFilter: "blur(35px)" }}>
          
          <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:opacity-[0.1] transition-all group-hover:rotate-12 duration-1000">
            <User size={180} strokeWidth={1} className="text-[#D4AF37]" />
          </div>

          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <motion.div 
                whileHover={{ scale: 1.08 }}
                onClick={handleAvatarClick}
                className="h-32 w-32 rounded-[45px] overflow-hidden flex items-center justify-center cursor-pointer relative group/avatar shadow-2xl border-4 border-[#D4AF37]/40"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                {uploading ? (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/40 transition-all z-10 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 backdrop-blur-sm">
                    <Camera size={32} className="text-[#D4AF37]" />
                  </div>
                )}
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <User size={60} className="text-[#D4AF37]/20" />}
              </motion.div>
              <div className="absolute -bottom-2 -right-2 h-11 w-11 rounded-[20px] flex items-center justify-center bg-gold-gradient shadow-2xl border-4 border-[#0D0D0D] z-20">
                <ShieldCheck size={20} className="text-black" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{user.username}</h2>
              <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-gold-gradient text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(212,175,55,0.3)] border border-white/20">
                <Crown size={16} />
                <span>Tier V{user.vipLevel} Institutional</span>
              </div>
            </div>
          </div>

          {/* Core Stats - Yellow Highlights */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-10 border-t border-[#D4AF37]/10">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40 mb-3">Vault Reserves</p>
              <p className="text-2xl font-black text-white tabular-nums drop-shadow-md">${(user.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center border-l border-[#D4AF37]/10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#38A169]/40 mb-3">Institutional Yield</p>
              <p className="text-2xl font-black text-[#38A169] tabular-nums drop-shadow-md">+${(user.totalCommission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </motion.div>

        {/* Tactical Invite Code - More Yellow */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-[45px] p-10 bg-black/60 border border-[#D4AF37]/20 flex flex-col gap-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gold-gradient opacity-5" />
          <div className="flex items-center gap-3 relative z-10">
            <Sparkles size={18} className="text-[#D4AF37] drop-shadow-[0_0_10px_#D4AF37]" />
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Strategic Referral Protocol</p>
          </div>
          <div className="flex gap-5 relative z-10">
            <div className="flex-1 rounded-[25px] px-8 py-6 font-black text-[#D4AF37] tracking-[0.5em] text-lg bg-black/60 border border-[#D4AF37]/30 shadow-inner flex items-center">
              {user.inviteCode || "UNASSIGNED"}
            </div>
            <button onClick={() => copyCode(user.inviteCode || "")}
              className="h-20 px-8 rounded-[25px] bg-gold-gradient text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_15px_40px_rgba(212,175,55,0.4)]">
              <Copy size={28} />
            </button>
          </div>
        </motion.div>

        {/* Identity Navigation - Yellow Tinted */}
        <div className="space-y-5">
          {menuItems.map(({ icon: Icon, label, path }, i) => (
            <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => path !== "#" && router.push(path)}
              className="w-full rounded-[35px] p-8 flex items-center justify-between group bg-[#D4AF37]/5 border border-[#D4AF37]/10 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-all shadow-xl"
            >
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-[22px] bg-black/40 border border-[#D4AF37]/20 flex items-center justify-center group-hover:border-[#D4AF37]/60 group-hover:scale-110 transition-all shadow-lg">
                  <Icon size={24} className="text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-colors" />
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">{label}</span>
              </div>
              <ChevronRight size={22} className="text-[#D4AF37]/20 group-hover:text-[#D4AF37] transition-all group-hover:translate-x-1" />
            </motion.button>
          ))}

          {/* Secure Logout */}
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full rounded-[35px] p-8 flex items-center gap-6 bg-[#E53E3E]/5 border border-[#E53E3E]/20 hover:bg-[#E53E3E]/15 transition-all group shadow-xl"
          >
            <div className="h-14 w-14 rounded-[22px] bg-[#E53E3E]/10 flex items-center justify-center border border-[#E53E3E]/30 shadow-lg">
              <LogOut size={24} className="text-[#E53E3E]" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#E53E3E]">Terminate Institutional Session</span>
          </motion.button>
        </div>

        {/* Operation History - Yellow Themes */}
        {tasks.length > 0 && (
          <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 bg-gold-gradient rounded-full shadow-[0_0_10px_#D4AF37]" />
                <h3 className="text-[13px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Operational Transcript</h3>
              </div>
              <div className="h-[1px] w-20 bg-gold-gradient opacity-20 shadow-[0_0_10px_#D4AF37]" />
            </div>
            <div className="space-y-5">
              {tasks.slice(0, 10).map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.04 }}
                  className="flex items-center justify-between rounded-[40px] p-8 bg-[#D4AF37]/5 border border-[#D4AF37]/10 hover:bg-[#D4AF37]/15 transition-all shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-[0.02] transition-opacity" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="h-20 w-20 rounded-[30px] bg-black/60 border border-[#D4AF37]/20 p-4 shadow-xl backdrop-blur-md">
                      <img src={task.productImage} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[150px] drop-shadow-md">{task.productName}</p>
                      <p className="text-[10px] font-bold text-[#D4AF37]/30 uppercase tracking-[0.3em] mt-2">
                        {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-[#38A169] tabular-nums tracking-tighter drop-shadow-lg relative z-10">+${task.commission.toFixed(2)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Global Center-Screen Premium Modals */}
      <AnimatePresence>
        {(modalError || successMessage) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
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
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-md">{modalError ? 'Protocol Alert' : 'Sync Success'}</h3>
              <p className="text-[14px] font-medium text-white/40 leading-relaxed mb-12 px-6 uppercase tracking-wide">{modalError || successMessage}</p>
              <div className="flex flex-col gap-5">
                <button onClick={() => { setModalError(null); setSuccessMessage(null); }} className="h-18 w-full rounded-[25px] bg-gold-gradient text-black font-black uppercase text-[12px] tracking-[0.3em] shadow-[0_15px_40px_rgba(212,175,55,0.4)] active:scale-95 transition-all">Dismiss Terminal</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .bg-gold-gradient { background: ${GOLDEN_GRADIENT}; }
      `}</style>
    </div>
  );
}
