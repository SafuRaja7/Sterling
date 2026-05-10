"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, X, Shield } from "lucide-react";

export default function SecurityProfile() {
  const router = useRouter();

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
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#F5F5F5]">Trust & Security</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="px-6 space-y-8 relative z-10">
        
        {/* Logos Section */}
        <div className="text-center mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)] mb-6">Certified & Trusted By</p>
          <div className="flex items-center justify-center gap-8 mb-6">
            <span className="text-[#F5F5F5] font-black text-xl italic tracking-tighter opacity-80">Visa</span>
            
            {/* Mastercard Mock Logo */}
            <div className="flex -space-x-4 opacity-80">
              <div className="w-10 h-10 rounded-full bg-[#EB001B] mix-blend-screen"></div>
              <div className="w-10 h-10 rounded-full bg-[#F79E1B] mix-blend-screen"></div>
            </div>

            <span className="text-[#F5F5F5] font-black text-xl italic tracking-tighter opacity-80">PayPal</span>
          </div>
          <p className="text-[8px] font-bold italic text-[rgba(245,245,245,0.3)]">* All logos are trademarks of their respective owners.</p>
        </div>

        {/* Certificate Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="luxury-glass rounded-[32px] p-8 text-center flex flex-col items-center mt-8"
          style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          
          <div className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: "rgba(212,175,55,0.05)", border: "2px solid rgba(212,175,55,0.2)" }}>
            <FileText size={32} className="text-[#D4AF37]" />
          </div>
          
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#F5F5F5] mb-3">Compliance Certificates</h2>
          
          <p className="text-[10px] text-[rgba(245,245,245,0.5)] font-medium leading-relaxed max-w-[250px] mx-auto mb-8">
            Click below to view our official business registration and security compliance certificates.
          </p>

          <button onClick={() => router.push('/certificate')} className="btn-gold w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-xs">
            VIEW OFFICIAL CERTIFICATES
          </button>
        </motion.div>

      </main>
    </div>
  );
}
