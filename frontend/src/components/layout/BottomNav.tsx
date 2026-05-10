"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CheckSquare, Wallet, User } from "lucide-react";

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
      {/* Gold top border line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40" />

      <div className="bg-[#0D0D0D]/95 backdrop-blur-2xl px-4 pb-safe pt-2 pb-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 group"
              >
                {/* Active gold pill indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: "rgba(212,175,55,0.08)",
                      border: "1px solid rgba(212,175,55,0.2)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div className={`relative z-10 transition-all duration-300 ${
                  isActive
                    ? "text-[#D4AF37]"
                    : "text-[rgba(245,245,245,0.3)] group-hover:text-[rgba(245,245,245,0.7)]"
                }`}
                  style={isActive ? { filter: "drop-shadow(0 0 8px rgba(212,175,55,0.6))" } : {}}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>

                <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive ? "text-[#D4AF37]" : "text-[rgba(245,245,245,0.3)] group-hover:text-[rgba(245,245,245,0.6)]"
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
