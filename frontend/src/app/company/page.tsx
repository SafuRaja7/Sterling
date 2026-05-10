"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Zap, Globe, Handshake } from "lucide-react";

export default function CompanyProfile() {
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: "SECURITY",
      desc: "Military-grade encryption for all transactions."
    },
    {
      icon: Zap,
      title: "EFFICIENCY",
      desc: "Instant order matching and processing."
    },
    {
      icon: Globe,
      title: "GLOBAL REACH",
      desc: "Connecting you to the world's top merchants."
    },
    {
      icon: Handshake,
      title: "TRUST",
      desc: "Transparent operations and verified partnerships."
    }
  ];

  return (
    <div className="min-h-screen luxury-bg pb-12 font-sans relative overflow-hidden">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-60 -left-40 opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between relative z-10">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all"
          style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }}>
          <ArrowLeft size={20} className="text-[rgba(245,245,245,0.6)]" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#F5F5F5]">Company Profile</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="px-6 space-y-6 relative z-10">
        
        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="luxury-glass rounded-[28px] p-6 flex flex-col"
              style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.1)" }}>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <f.icon size={20} className="text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#F5F5F5] mb-2">{f.title}</h3>
                <p className="text-[10px] text-[rgba(245,245,245,0.4)] font-medium leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Company Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="luxury-glass rounded-[32px] p-8"
          style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.2)" }}>
          
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-6">Company Details</h2>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-[rgba(245,245,245,0.05)] pb-5">
              <span className="text-[11px] font-bold text-[rgba(245,245,245,0.5)]">Registration No.</span>
              <span className="text-xs font-black text-[#F5F5F5] tracking-widest">SG-2018-GMS-001</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[rgba(245,245,245,0.05)] pb-5">
              <span className="text-[11px] font-bold text-[rgba(245,245,245,0.5)]">Headquarters</span>
              <span className="text-xs font-black text-[#F5F5F5]">London, UK</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-[rgba(245,245,245,0.5)]">Email</span>
              <span className="text-[10px] font-black text-gold-gradient">support@sterlingshopifymarket.com</span>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
