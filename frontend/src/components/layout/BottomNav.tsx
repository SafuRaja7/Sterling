"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CheckSquare, Wallet, User, Sparkles } from "lucide-react";

const navItems = [
  { icon: Home, label: "Hub", path: "/dashboard" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* High-Impact Gold top border line with glow */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.2)]" />

      {/* Premium Dark Navigation - Matching Hub */}
      <div className="bg-[#0D0D0D]/95 backdrop-blur-3xl px-6 pb-safe pt-4 pb-6 border-t border-white/5 shadow-2xl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center gap-2 px-6 py-2 group transition-all"
              >
                {/* Active gold luxury indicator */}
                {isActive && (
                  <>
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-[20px]"
                      style={{
                        background: "rgba(212,175,55,0.1)",
                        border: "1px solid rgba(212,175,55,0.2)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_12px_#D4AF37]" 
                    />
                  </>
                )}

                <div className={`relative z-10 transition-all duration-300 ${
                  isActive
                    ? "text-[#D4AF37] scale-110"
                    : "text-white/20 group-hover:text-[#D4AF37]/60"
                }`}
                  style={isActive ? { filter: "drop-shadow(0 0 15px rgba(212,175,55,0.6))" } : {}}
                >
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>

                <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${
                  isActive ? "text-[#D4AF37]" : "text-white/20 group-hover:text-white/40"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
