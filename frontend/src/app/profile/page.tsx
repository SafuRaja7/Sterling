"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Settings, LogOut, Crown, Copy, ChevronRight, HelpCircle,
  User, Lock, MessageSquare, Gift, Activity, Camera, CreditCard
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";

export default function Profile() {
  const router = useRouter();
  const { user, token, logout, setUser } = useAuthStore();
   const [tasks, setTasks] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, [token]);

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
      toast.error(err.response?.data?.message || "Session error");
      logout(); router.push("/login");
    } finally { setLoading(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      // 1. Upload to server
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const imageUrl = uploadRes.data.url;
        
        // 2. Update user profile with new avatar URL
        const updateRes = await api.put('/user/avatar', { avatar: imageUrl });
        
        if (updateRes.data.success) {
          setUser({ ...user, avatar: imageUrl } as any);
          toast.success("Avatar updated successfully");
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const menuItems = [
    { icon: Lock, label: "Trust and Security", path: "/security" },
    { icon: CreditCard, label: "Wallet Address", path: "/wallet-address" },
    { icon: MessageSquare, label: "Support Chat", path: "/dashboard?chat=true" },
    { icon: HelpCircle, label: "FAQs", path: "/faq" },
    { icon: Settings, label: "Company Profile", path: "/platform-profile" },
  ];

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-bg pb-28 font-sans relative overflow-hidden">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-60 -left-40 opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between relative z-10">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all"
          style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }}>
          <ArrowLeft size={20} className="text-[rgba(245,245,245,0.6)]" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#F5F5F5]">Profile</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="px-6 space-y-5 relative z-10">
        {/* Identity Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] p-8 relative overflow-hidden"
          style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                onClick={handleAvatarClick}
                className="h-20 w-20 rounded-[24px] overflow-hidden flex items-center justify-center cursor-pointer relative group"
                style={{ background: "linear-gradient(135deg, #A08020, #D4AF37)", border: "3px solid rgba(212,175,55,0.3)", boxShadow: "0 8px 24px rgba(212,175,55,0.2)" }}>
                {uploading ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Camera size={20} className="text-white" />
                  </div>
                )}
                
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-[#0D0D0D]" />
                )}
              </div>
              <div 
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ background: "#D4AF37", border: "2px solid #0D0D0D" }}>
                <Camera size={12} className="text-[#0D0D0D]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#F5F5F5] tracking-tighter mb-2">{user.username}</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full w-fit"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)" }}>
                <Crown size={12} className="text-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">VIP {user.vipLevel}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-4" style={{ background: "#0D0D0D", border: "1px solid rgba(245,245,245,0.05)" }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.35)] mb-1">Balance</p>
              <p className="text-lg font-black text-gold-gradient tabular-nums">${(user.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#0D0D0D", border: "1px solid rgba(245,245,245,0.05)" }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-[rgba(56,161,105,0.7)] mb-1">Commission</p>
              <p className="text-lg font-black text-[#38A169] tabular-nums">+${(user.totalCommission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </motion.div>

        {/* Invite Code */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-[24px] p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.15)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)] mb-4">Referral Code</p>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl px-5 py-4 font-black text-[#D4AF37] tracking-[0.3em] text-sm"
              style={{ background: "#0D0D0D", border: "1px solid rgba(212,175,55,0.2)" }}>
              {user.inviteCode || "—"}
            </div>
            <button onClick={() => copyCode(user.inviteCode || "")}
              className="btn-gold px-5 rounded-xl flex items-center gap-2">
              <Copy size={16} />
            </button>
          </div>
        </motion.div>

        {/* Menu */}
        <div className="space-y-3">
          {menuItems.map(({ icon: Icon, label, path }, i) => (
            <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => path !== "#" && router.push(path)}
              className="w-full rounded-[20px] p-5 flex items-center justify-between group transition-all"
              style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.06)" }}>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:border-[#D4AF37]/40"
                  style={{ background: "rgba(245,245,245,0.04)", border: "1px solid rgba(245,245,245,0.06)" }}>
                  <Icon size={18} className="text-[rgba(245,245,245,0.5)] group-hover:text-[#D4AF37] transition-colors" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[rgba(245,245,245,0.7)] group-hover:text-[#F5F5F5] transition-colors">{label}</span>
              </div>
              <ChevronRight size={16} className="text-[rgba(245,245,245,0.2)] group-hover:text-[#D4AF37] transition-colors" />
            </motion.button>
          ))}

          {/* Logout */}
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full rounded-[20px] p-5 flex items-center gap-4 transition-all"
            style={{ background: "rgba(229,62,62,0.05)", border: "1px solid rgba(229,62,62,0.15)" }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(229,62,62,0.1)" }}>
              <LogOut size={18} className="text-[#E53E3E]" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#E53E3E]">Sign Out</span>
          </motion.button>
        </div>

        {/* Task History */}
        {tasks.length > 0 && (
          <div className="pb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)] mb-4">Task History</p>
            <div className="space-y-3">
              {tasks.slice(0, 20).map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.04 }}
                  className="flex items-center gap-4 rounded-[20px] p-4"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.05)" }}>
                  <div className="h-12 w-12 rounded-xl flex-shrink-0 overflow-hidden p-1.5"
                    style={{ background: "#252525", border: "1px solid rgba(212,175,55,0.1)" }}>
                    <img src={task.productImage} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#F5F5F5] truncate">{task.productName}</p>
                    <p className="text-[9px] text-[rgba(245,245,245,0.35)] font-bold uppercase tracking-widest mt-0.5">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#38A169] tabular-nums flex-shrink-0">+${task.commission.toFixed(2)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
