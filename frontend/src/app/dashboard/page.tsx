"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, CheckSquare, Wallet, Users,
  ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronRight,
  Crown, Zap, Star, UserPlus, ShieldCheck, FileText, 
  Handshake, BookOpen, UserCircle
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";
import GlobalActivity from "@/components/dashboard/GlobalActivity";

export default function Dashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get("/user/profile");
      const profileData = profileRes.data.data;
      useAuthStore.getState().setUser(profileData);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      toast.error(err.response?.data?.message || "An error occurred");
      logout();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const actions = [
    { label: "Deposit", icon: ArrowDownLeft, path: "/wallet", color: "rgba(56,161,105,0.1)", iconColor: "#38A169" },
    { label: "Withdraw", icon: ArrowUpRight, path: "/wallet", color: "rgba(229,62,62,0.1)", iconColor: "#E53E3E" },
    { label: "Invite", icon: UserPlus, path: "/invite", color: "rgba(49,130,206,0.1)", iconColor: "#3182CE" },
    { label: "Partners", icon: Handshake, path: "/partners", color: "rgba(212,175,55,0.1)", iconColor: "#D4AF37" },
  ];

  const insights = [
    { label: "Profile", image: "/platform-profile.png", path: "/platform-profile" },
    { label: "Rules", image: "/rules.png", path: "/rules" },
    { label: "Partners", image: "/cooperation.png", path: "/partners" },
    { label: "Guide", image: "/guide.png", path: "/guide" },
  ];

  return (
    <div className="min-h-screen luxury-bg pb-32 relative overflow-hidden font-sans">
      <div className="luxury-bg-orb w-[600px] h-[600px] -top-60 -right-40 opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[rgba(245,245,245,0.4)] mb-1">
            Welcome back
          </p>
          <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">
            {user.username}
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <Crown size={14} className="text-[#D4AF37]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
            VIP {user.vipLevel}
          </span>
        </div>
      </header>

      <main className="px-6 space-y-8 relative z-10">
        {/* Top Action Grid */}
        <div className="grid grid-cols-4 gap-3">
          {actions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(action.path)}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-full aspect-square rounded-3xl flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95"
                style={{ 
                  background: action.color, 
                  border: "1px solid rgba(245,245,245,0.05)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}>
                <action.icon size={28} style={{ color: action.iconColor }} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.5)] group-hover:text-[#F5F5F5] transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>

        <GlobalActivity />

        {/* Secure Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "rgba(56,161,105,0.08)", border: "1px solid rgba(56,161,105,0.15)" }}
        >
          <div className="h-10 w-10 rounded-xl bg-[#38A169]/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#38A169]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#38A169] mb-0.5">Secure & Verified</p>
            <p className="text-[9px] font-bold text-[rgba(245,245,245,0.4)] uppercase">Your funds are protected by GMS Shield.</p>
          </div>
          <ChevronRight size={16} className="text-[#38A169]/40" />
        </motion.div>

        {/* Platform Insights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)]">Platform Insights</p>
            <ChevronRight size={14} className="text-white/20" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {insights.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                onClick={() => router.push(item.path)}
                className="relative aspect-square rounded-2xl overflow-hidden group"
              >
                <img src={item.image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Official Partners Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="luxury-glass rounded-[28px] p-6 relative overflow-hidden group"
          onClick={() => router.push("/partners")}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Handshake size={64} className="text-[#D4AF37]" />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
              <Handshake size={16} className="text-[#D4AF37]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Official Partners</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {['amazon', 'facebook', 'walmart', 'ebay'].map((partner) => (
              <div key={partner} className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]/30 transition-colors">
                  <span className="text-[8px] font-black uppercase tracking-tighter italic text-white/40 group-hover:text-[#D4AF37] transition-colors">{partner}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-[9px] font-medium text-white/30 uppercase tracking-widest">Global Ecosystem Network</p>
            <div className="flex items-center gap-1 text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest group-hover:gap-2 transition-all">
              View All <ChevronRight size={10} />
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}