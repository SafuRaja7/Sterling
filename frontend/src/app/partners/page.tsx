"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Handshake, Users, TrendingUp, Headphones } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function Cooperation() {
  const router = useRouter();

  const benefits = [
    { title: "Agent Program", icon: Users, text: "At Sterling Shopify Market, we carry out win-win cooperation for all users. Our agent program allows you to earn extra income by inviting friends to join the platform." },
    { title: "Team Rewards", icon: TrendingUp, text: "As an agent, you can receive commissions from your team's task volume. The more active your team is, the higher your rewards." },
    { title: "Full Support", icon: Headphones, text: "We provide comprehensive support for our partners, including marketing materials, training, and dedicated account managers." }
  ];

  return (
    <div className="min-h-screen luxury-bg pb-32 relative overflow-hidden font-sans">
      <div className="luxury-bg-orb w-[600px] h-[600px] top-40 -right-40 opacity-15" />
      
      <header className="px-6 pt-12 pb-6 relative z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/60">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-[#F5F5F5] tracking-tight">Win-win Cooperation</h1>
      </header>

      <main className="px-6 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src="/cooperation.png" alt="Partners" className="w-full h-full object-cover" />
        </motion.div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tighter">Strategic Partnerships</h2>
            <p className="text-[10px] font-bold text-gold-gradient uppercase tracking-[0.3em]">Building the Future Together</p>
          </div>

          <div className="grid gap-4">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="luxury-glass rounded-[28px] p-6 border border-[#D4AF37]/5 text-center"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 mx-auto mb-4">
                  <benefit.icon size={24} className="text-[#D4AF37]" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">{benefit.title}</h3>
                <p className="text-[12px] leading-relaxed text-white/40 font-medium">
                  {benefit.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
