"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isHidden = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isHidden) return null;

  return (
    <header className="sticky top-0 left-0 right-0 z-[100]">
      {/* Glassmorphism background */}
      <div className="bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-10 w-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.3)] border border-[#D4AF37]/20"
          >
            <img 
              src="/logo.png" 
              alt="Sterling Logo" 
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Name */}
          <div className="flex-1 flex flex-col">
            <h1 className="text-[13px] font-black tracking-tight text-[#F5F5F5] uppercase">
              Sterling <span className="text-gold-gradient">Shopify Market</span>
            </h1>
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.4em] mt-0.5">
              {isAdmin ? "Command Center | Global Hub" : "Global Hub Platform"}
            </p>
          </div>

          {isAdmin && (
            <div className="px-2 py-1 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/20">
               <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest">Admin</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Gold accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
    </header>
  );
}
