"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, Share2, Users, Gift, Sparkles, CheckCircle2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function InvitePage() {
  const router = useRouter();
  const { user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(!user);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) {
      api.get("/user/profile")
        .then(({ data }) => {
          setUser(data.data);
          setLoading(false);
        })
        .catch(() => router.push("/login"));
    }
  }, [token, user]);

  const handleCopy = () => {
    if (!user?.inviteCode) return;
    navigator.clipboard.writeText(user.inviteCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#07070c]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?invite=${user.inviteCode}`;

  return (
    <div className="min-h-screen bg-[#07070c] text-white pb-20 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-6 flex items-center gap-4 bg-[#07070c]/80 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-tight">Invite Partners</h1>
      </header>

      <main className="max-w-md mx-auto px-6 mt-8 space-y-8">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[32px] blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-[#0d0d14] border border-white/10 rounded-[32px] p-8 text-center">
            <div className="w-20 h-20 bg-amber-400/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-400">
              <Gift size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">Share the Success</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Invite your friends to Sterling Market and earn premium commissions on every task they complete.
            </p>

            {/* Code Box */}
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Your Unique Code</div>
              <div 
                onClick={handleCopy}
                className="group/code relative cursor-pointer"
              >
                <div className="absolute -inset-2 bg-amber-400/5 rounded-2xl opacity-0 group-hover/code:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-4 py-4 px-8 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-3xl font-black tracking-[0.2em] text-amber-400">{user.inviteCode}</span>
                  <div className="h-8 w-[1px] bg-white/10" />
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <CheckCircle2 size={24} className="text-emerald-400" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Copy size={24} className="text-white/20 group-hover/code:text-white transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>



        <p className="text-center text-[10px] text-white/20 font-medium uppercase tracking-[0.2em] pt-4">
          Terms & Conditions Apply • 2024 Sterling Global
        </p>
      </main>
    </div>
  );
}
