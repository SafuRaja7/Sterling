"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Star } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen luxury-bg relative overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Background orbs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="luxury-bg-orb w-[800px] h-[800px] -top-60 -right-40" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
        className="luxury-bg-orb w-[600px] h-[600px] -bottom-40 -left-40" 
      />

      {/* Gold shimmer line */}
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.6 }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" 
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.3 }
          }
        }}
        className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg"
      >
        {/* Logo with 3D Float */}
        <motion.div
          variants={{
            hidden: { scale: 0.5, opacity: 0, rotateY: -180 },
            visible: { 
              scale: 1, 
              opacity: 1, 
              rotateY: 0,
              transition: { type: "spring", damping: 12, stiffness: 100 }
            }
          }}
          className="h-32 w-32 flex items-center justify-center mb-10 relative cursor-pointer"
          whileHover={{ scale: 1.15, rotateY: 20 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-full h-full overflow-hidden flex items-start justify-center"
               style={{
                 maskImage: "radial-gradient(circle at center, black 40%, transparent 75%)",
                 WebkitMaskImage: "radial-gradient(circle at center, black 40%, transparent 75%)"
               }}>
            <img 
              src="/images/icons/shopify.png" 
              alt="Logo" 
              className="w-full h-[140%] object-contain object-top drop-shadow-[0_20px_50px_rgba(212,175,55,0.6)]"
              style={{ 
                filter: "drop-shadow(0 0 10px rgba(212,175,55,0.3)) contrast(1.2) brightness(1.1)",
                mixBlendMode: "screen"
              }}
            />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-[#D4AF37]/5 blur-3xl -z-10" 
          />
        </motion.div>

        {/* Brand name */}
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="text-6xl font-black tracking-tighter mb-3"
        >
          <span className="text-[#F5F5F5]">Sterling</span>{" "}
          <span className="text-gold-gradient">Market</span>
        </motion.h1>

        <motion.div
          variants={{
            hidden: { scaleX: 0 },
            visible: { scaleX: 1, transition: { duration: 0.8 } }
          }}
          className="gold-divider w-48 my-6"
        />

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="flex flex-wrap items-center justify-center gap-3 mb-14"
        >
          {[
            { icon: Shield, label: "Secured" },
            { icon: Star, label: "VIP Access" },
            { icon: Zap, label: "Instant Yield" },
          ].map(({ icon: Icon, label }) => (
            <motion.div
              key={label}
              whileHover={{ y: -5, backgroundColor: "rgba(212,175,55,0.15)" }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "#D4AF37",
              }}
            >
              <Icon size={12} />
              {label}
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
          className="flex flex-col gap-4 w-full"
        >
          <button
            onClick={() => router.push("/login")}
            className="btn-gold w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-sm group"
            style={{ boxShadow: "0 8px 30px rgba(212,175,55,0.3)" }}
          >
            Access Platform
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowRight size={18} />
            </motion.div>
          </button>

          <button
            onClick={() => router.push("/register")}
            className="btn-ghost-gold w-full py-5 rounded-2xl text-sm hover:bg-white/5 transition-colors"
          >
            Create Account
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom shimmer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" 
      />
    </div>
  );
}
