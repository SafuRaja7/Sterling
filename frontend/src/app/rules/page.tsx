"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Scale, CreditCard, Clock, Lock } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function Rules() {
  const router = useRouter();

  const rules = [
    { title: "Recharge Rules", icon: CreditCard, text: "The platform will change the recharge address from time to time. Please check the latest address before each recharge." },
    { title: "Withdrawal Rules", icon: Clock, text: "Withdrawals are processed within 24 hours. The minimum withdrawal amount is 10 USDT. Address changes require contact with customer service and verification of your withdrawal password." },
    { title: "Task Rules", icon: Scale, text: "Each VIP level has a specific number of daily tasks. Tasks must be completed within the day." },
    { title: "Account Security", icon: Lock, text: "Users are responsible for their account security. A mandatory withdrawal password must be set to protect your funds." }
  ];

  return (
    <div className="min-h-screen luxury-bg pb-32 relative overflow-hidden font-sans">
      <div className="luxury-bg-orb w-[600px] h-[600px] -bottom-60 -left-40 opacity-15" />
      
      <header className="px-6 pt-12 pb-6 relative z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/60">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-[#F5F5F5] tracking-tight">Platform Rules</h1>
      </header>

      <main className="px-6 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src="/rules.png" alt="Platform Rules" className="w-full h-full object-cover" />
        </motion.div>

        <div className="space-y-4">
          {rules.map((rule, i) => (
            <motion.div 
              key={rule.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="luxury-glass rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                  <rule.icon size={16} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-[#F5F5F5]">{rule.title}</h2>
              </div>
              <p className="text-[12px] leading-relaxed text-white/50 font-medium">
                {rule.text}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
