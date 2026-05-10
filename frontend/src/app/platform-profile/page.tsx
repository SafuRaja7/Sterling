"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Shield, Target } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function PlatformProfile() {
  const router = useRouter();

  return (
    <div className="min-h-screen luxury-bg pb-32 relative overflow-hidden font-sans">
      <div className="luxury-bg-orb w-[600px] h-[600px] -top-60 -right-40 opacity-15" />
      
      {/* Header */}
      <header className="px-6 pt-12 pb-6 relative z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/60">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-[#F5F5F5] tracking-tight">Platform Profile</h1>
      </header>

      <main className="px-6 space-y-8 relative z-10">
        {/* Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src="/platform-profile.png" alt="Sterling HQ" className="w-full h-full object-cover" />
        </motion.div>

        {/* Content Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div className="luxury-glass rounded-3xl p-6 border border-[#D4AF37]/10">
            <h2 className="text-gold-gradient text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe size={16} /> Global Hub
            </h2>
            <p className="text-[13px] leading-relaxed text-white/70 font-medium">
              Sterling Shopify Market is an intelligent cloud global order matching center. It was established in 2018 and is headquartered in London, UK. It has branches in more than 20 countries and regions around the world.
            </p>
          </div>

          <div className="luxury-glass rounded-3xl p-6 border border-[#D4AF37]/10">
            <h2 className="text-gold-gradient text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield size={16} /> AI Technology
            </h2>
            <p className="text-[13px] leading-relaxed text-white/70 font-medium">
              Sterling Shopify Market uses advanced AI algorithms to match global e-commerce orders with users, helping merchants increase sales volume and exposure while providing users with generous commission rewards.
            </p>
          </div>

          <div className="luxury-glass rounded-3xl p-6 border border-[#D4AF37]/10">
            <h2 className="text-gold-gradient text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={16} /> Our Mission
            </h2>
            <p className="text-[13px] leading-relaxed text-white/70 font-medium">
              Our mission is to build the world's most trusted order matching ecosystem, creating value for both merchants and users through technology and innovation.
            </p>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
