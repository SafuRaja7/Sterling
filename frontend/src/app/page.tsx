"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Zap, Star } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen luxury-bg relative overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Background orbs */}
      <div className="luxury-bg-orb w-[600px] h-[600px] -top-60 -right-40 opacity-30" />
      <div className="luxury-bg-orb w-[500px] h-[500px] -bottom-40 -left-40 opacity-20" style={{ animationDelay: "3s" }} />

      {/* Gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-24 w-24 rounded-[32px] flex items-center justify-center mb-10 relative"
          style={{
            background: "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F0D060 100%)",
            boxShadow: "0 20px 60px rgba(212,175,55,0.4)",
          }}
        >
          <TrendingUp size={48} className="text-[#0D0D0D]" strokeWidth={2.5} />
          <div className="absolute inset-0 rounded-[32px]" style={{ animation: "goldPulse 3s ease-in-out infinite" }} />
        </motion.div>

        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-6xl font-black tracking-tighter mb-3"
        >
          <span className="text-[#F5F5F5]">Sterling</span>{" "}
          <span className="text-gold-gradient">Market</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5 }}
          className="gold-divider w-48 my-6"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-14"
        >
          {[
            { icon: Shield, label: "Secured" },
            { icon: Star, label: "VIP Access" },
            { icon: Zap, label: "Instant Yield" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "#D4AF37",
              }}
            >
              <Icon size={12} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-4 w-full"
        >
          <button
            onClick={() => router.push("/login")}
            className="btn-gold w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-sm"
            style={{ boxShadow: "0 8px 30px rgba(212,175,55,0.3)" }}
          >
            Access Platform
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => router.push("/register")}
            className="btn-ghost-gold w-full py-5 rounded-2xl text-sm"
          >
            Create Account
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-30" />
    </div>
  );
}
