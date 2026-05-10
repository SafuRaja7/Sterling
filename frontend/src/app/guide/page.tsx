"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, MousePointer2, Wallet, Headphones } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function Guide() {
  const router = useRouter();

  const steps = [
    { title: "How to start", icon: Play, text: "Complete your profile and recharge your account to unlock VIP levels." },
    { title: "How to grab orders", icon: MousePointer2, text: "Go to the Task Center, select a merchant, and click 'Grab Order'." },
    { title: "How to earn", icon: Wallet, text: "Commissions are automatically added to your balance after each successful order." },
    { title: "Support", icon: Headphones, text: "If you encounter any issues, please contact our 24/7 customer service." }
  ];

  return (
    <div className="min-h-screen luxury-bg pb-32 relative overflow-hidden font-sans">
      <div className="luxury-bg-orb w-[600px] h-[600px] -top-20 -left-20 opacity-15" />
      
      <header className="px-6 pt-12 pb-6 relative z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/60">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-[#F5F5F5] tracking-tight">Instructions for Use</h1>
      </header>

      <main className="px-6 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src="/guide.png" alt="User Guide" className="w-full h-full object-cover" />
        </motion.div>

        <div className="luxury-glass rounded-3xl p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Play size={80} className="text-white" />
          </div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4">Membership Milestone</h2>
          <p className="text-[13px] leading-relaxed text-white/60 font-medium italic">
            "To celebrate the Sterling Shopify Market membership surpassing 10 million, we have updated our user guide."
          </p>
        </div>

        <div className="grid gap-4">
          {steps.map((step, i) => (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
            >
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <step.icon size={20} className="text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#F5F5F5] uppercase tracking-wider">{step.title}</h3>
                <p className="text-[11px] leading-relaxed text-white/40 font-medium">
                  {step.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
