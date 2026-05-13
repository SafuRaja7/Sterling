"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Wallet, Users,
  ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronRight,
  Crown, Zap, Star, UserPlus, ShieldCheck, FileText, 
  Handshake, BookOpen, UserCircle, Sparkles, TrendingUp,
  LayoutDashboard, Globe, ShieldAlert
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";
import GlobalActivity from "@/components/dashboard/GlobalActivity";
import { FaAmazon, FaFacebookF, FaEbay } from "react-icons/fa";
import { SiWalmart } from "react-icons/si";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F5E0A0 100%)";

export default function Dashboard() {
  const router = useRouter();
  const { user, token, logout, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    todayEarnings: 0,
    completedTasks: 0
  });

  useEffect(() => {
    if (_hasHydrated) {
      if (!token) {
        router.push("/login");
      } else {
        fetchDashboard();
      }
    }
  }, [_hasHydrated, token, router]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get("/user/profile");
      const profileData = profileRes.data.data;
      useAuthStore.getState().setUser(profileData);
      
      setStats({
        totalEarnings: profileData.total_commission || 0,
        todayEarnings: profileData.today_commission || 0,
        completedTasks: profileData.daily_tasks_completed || 0
      });
    } catch (err: any) {
      console.error("Dashboard error:", err);
      // Only redirect on actual 401 Unauthorized errors
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const actions = [
    { label: "Deposit", icon: ArrowDownLeft, path: "/wallet" },
    { label: "Withdraw", icon: ArrowUpRight, path: "/wallet" },
    { label: "Invite", icon: UserPlus, path: "/invite" },
    { label: "Tier List", icon: Crown, path: "/tasks" },
  ];

  const insights = [
    { label: "Events", image: "/platform-profile.png", path: "/events" },
    { label: "Rules", image: "/rules.png", path: "/rules" },
    { label: "Partners", image: "/cooperation.png", path: "/partners" },
    { label: "Guide", image: "/guide.png", path: "/guide" },
  ];

  const partners = [
  { name: "Amazon", icon: FaAmazon },
  { name: "Facebook", icon: FaFacebookF },
  { name: "Walmart", icon: SiWalmart },
  { name: "Ebay", icon: FaEbay },
];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#1A1A1A] to-[#050505] pb-32 relative overflow-hidden font-sans">
      {/* Subtle Yellow Gradient Accents (Toned Down) */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[60%] h-[30%] bg-[#D4AF37]/3 blur-[100px] rounded-full pointer-events-none" />
      
      {/* User Friendly Header */}
      <header className="px-8 pt-16 pb-12 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-[24px] bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gold-gradient opacity-10" />
             <img src="/images/icons/shopify.png" alt="Logo" className="w-10 h-10 object-contain relative z-10" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40 mb-1">Welcome back,</p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {user.username} <span className="text-[#D4AF37] text-lg ml-1">V{user.vipLevel}</span>
            </h1>
          </div>
        </div>
        <button onClick={() => router.push("/profile")} className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4AF37]/10 transition-all shadow-xl">
          <UserCircle size={26} className="text-[#D4AF37]/60" />
        </button>
      </header>

      <main className="px-8 space-y-12 relative z-10">
        
        {/* Action Grid - Bigger Container */}
        <div className="grid grid-cols-4 gap-6">
          {actions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(action.path)}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-active:scale-95 relative overflow-hidden shadow-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                <div className="absolute inset-0 bg-gold-gradient opacity-5 group-hover:opacity-20 transition-opacity" />
                <action.icon size={32} className="text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Live Activity Display - Moved Up */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-5 w-1.5 bg-[#D4AF37]/40 rounded-full" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60">Recent Activity</h3>
          </div>
          <div className="bg-black/40 backdrop-blur-xl rounded-[40px] p-2 border border-[#D4AF37]/10 shadow-2xl overflow-hidden">
            <GlobalActivity />
          </div>
        </div>

        {/* Platform Insights - Smaller Images */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 bg-[#D4AF37]/40 rounded-full" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60">Platform Insights</h3>
            </div>
            <ChevronRight size={14} className="text-white/10" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {insights.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => router.push(item.path)}
                className="relative aspect-square rounded-[24px] overflow-hidden group shadow-xl border border-white/5 bg-black/40 p-8"
              >
                <img src={item.image} alt="" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex items-end justify-center pb-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Official Partners Section - Small Logos */}
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 px-2">
            <div className="h-5 w-1.5 bg-[#D4AF37]/40 rounded-full" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60">Global Partners</h3>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[40px] p-6 relative overflow-hidden bg-black/40 border border-[#D4AF37]/10 shadow-2xl group cursor-pointer"
            onClick={() => router.push("/partners")}
          >
            <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
              <Handshake size={180} className="text-[#D4AF37]" />
            </div>
            
            <div className="grid grid-cols-4 gap-4 relative z-10">
  {partners.map((partner) => (
    <div key={partner.name} className="flex flex-col items-center gap-3">
      <div className="w-full aspect-square rounded-[20px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-center p-6 group-hover:border-[#D4AF37]/30 transition-all duration-500">
        <partner.icon
          size={42}
          className="text-white/40 group-hover:text-[#D4AF37] transition-all duration-500"
        />
      </div>

      <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">
        {partner.name}
      </span>
    </div>
  ))}
</div>

            <div className="mt-6 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#D4AF37]/40" />
                <p className="text-[10px] font-medium text-white/20 uppercase tracking-[0.2em]">Institutional Network</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest group-hover:gap-3 transition-all">
                Details <ChevronRight size={12} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security Summary */}
        <motion.div
          className="rounded-[40px] p-10 flex flex-col items-center text-center gap-6 relative overflow-hidden bg-black/40 border border-[#D4AF37]/10"
        >
          <div className="h-16 w-16 rounded-3xl bg-[#D4AF37]/10 flex items-center justify-center">
            <ShieldCheck size={32} className="text-[#D4AF37]" />
          </div>
          <div className="space-y-2">
            <p className="text-[14px] font-black uppercase tracking-[0.4em] text-white">Secure Platform</p>
            <p className="text-[11px] font-medium text-white/20 leading-relaxed uppercase tracking-widest max-w-[240px]">All transactions are protected by institutional grade security.</p>
          </div>
        </motion.div>

      </main>

      <BottomNav />

      <style jsx global>{`
        .bg-gold-gradient { background: ${GOLDEN_GRADIENT}; }
      `}</style>
    </div>
  );
}