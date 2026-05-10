"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";

export default function CertificatePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen luxury-bg flex flex-col font-sans relative overflow-hidden">
      <div className="luxury-bg-orb w-[600px] h-[600px] -top-40 -right-40 opacity-20" />
      <div className="luxury-bg-orb w-[500px] h-[500px] -bottom-40 -left-20 opacity-15" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between relative z-10 bg-black/20 backdrop-blur-md border-b border-[rgba(212,175,55,0.1)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#38A169]" />
          <h1 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F5F5]">Official Document</h1>
        </div>
        <button onClick={() => router.back()} className="h-10 w-10 rounded-full flex items-center justify-center transition-all bg-white/5 border border-white/10 hover:bg-white/10">
          <X size={20} className="text-[rgba(245,245,245,0.6)]" />
        </button>
      </header>

      {/* Certificate Container */}
      <main className="flex-1 px-6 py-8 flex flex-col items-center justify-center relative z-10 overflow-y-auto">
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full max-w-lg p-2 rounded-[24px]"
          style={{ background: "linear-gradient(135deg, #A08020, #D4AF37, #F0D060)", boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}>
          
          <div className="rounded-[20px] p-8 md:p-10 relative overflow-hidden flex flex-col items-center text-center"
            style={{ background: "#0D0D0D", backgroundImage: "radial-gradient(circle at top right, rgba(212,175,55,0.1), transparent 50%)" }}>
            
            {/* Watermark / Stamp */}
            <div className="absolute top-10 right-10 w-24 h-24 rounded-full border border-[rgba(212,175,55,0.1)] flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-[rgba(212,175,55,0.05)]" />
            </div>

            <h2 className="text-[#D4AF37] font-serif italic text-lg mb-4 opacity-90">Certificate of Compliance</h2>
            
            <h1 className="text-3xl font-black text-[#F5F5F5] leading-tight mb-8" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              Sterling Shopify Market<br />Global
            </h1>

            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-8" />

            <p className="text-[11px] text-[rgba(245,245,245,0.6)] font-medium leading-relaxed max-w-[280px] mx-auto mb-10">
              This is to certify that Sterling Shopify Market Global Merchant Services is a registered entity operating under the regulatory framework of digital commerce and financial security standards.
            </p>

            <div className="w-full text-left space-y-6 mb-12">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(245,245,245,0.4)] mb-1">Registration No.</p>
                <p className="text-sm font-black text-[#F5F5F5] tracking-widest">SG-2018-GMS-001</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(245,245,245,0.4)] mb-1">Headquarters</p>
                <p className="text-sm font-black text-[#F5F5F5]">London, UK</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(245,245,245,0.4)] mb-1">Official Email</p>
                <p className="text-sm font-black text-[#D4AF37]">support@sterlingshopifymarket.com</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(245,245,245,0.4)] mb-1">Issued Date</p>
                <p className="text-sm font-black text-[#F5F5F5]">Jan 12, 2018</p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex flex-col items-center mt-auto">
              {/* Mock Signature using an SVG path */}
              <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                <path d="M5 30C15 15 25 5 35 15C45 25 55 35 65 25C75 15 85 5 95 15C105 25 115 15 115 15" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M45 35C65 35 85 30 100 25" stroke="url(#paint0_linear)" strokeWidth="1" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="0" y1="0" x2="120" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#A08020" />
                    <stop offset="0.5" stopColor="#D4AF37" />
                    <stop offset="1" stopColor="#F0D060" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="w-32 h-px bg-[rgba(245,245,245,0.2)] mb-2" />
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[rgba(245,245,245,0.4)] italic">Authorized Signature</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mt-1">CEO Sterling Shopify Market</p>
            </div>

          </div>
        </motion.div>

      </main>
    </div>
  );
}
