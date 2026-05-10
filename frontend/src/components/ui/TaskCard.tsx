"use client";

import { motion } from "framer-motion";
import { Crown, Lock } from "lucide-react";

interface TaskCardProps {
  level: number;
  minBalance: number;
  commissionRate: number;
  status: "available" | "locked" | "active";
  onClick: () => void;
}

export default function TaskCard({ level, minBalance, commissionRate, status, onClick }: TaskCardProps) {
  const isLocked = status === "locked";

  return (
    <motion.button
      whileHover={!isLocked ? { y: -2, scale: 1.01 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={!isLocked ? onClick : undefined}
      disabled={isLocked}
      className="w-full text-left rounded-[24px] p-5 transition-all duration-300"
      style={{
        background: isLocked ? "#141414" : "#1A1A1A",
        border: isLocked
          ? "1px solid rgba(245,245,245,0.04)"
          : "1px solid rgba(212,175,55,0.2)",
        borderTop: isLocked
          ? "2px solid rgba(245,245,245,0.05)"
          : "2px solid #D4AF37",
        boxShadow: isLocked ? "none" : "0 4px 20px rgba(0,0,0,0.4)",
        opacity: isLocked ? 0.5 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="h-11 w-11 rounded-2xl flex items-center justify-center"
            style={{
              background: isLocked
                ? "rgba(245,245,245,0.03)"
                : "rgba(212,175,55,0.1)",
              border: isLocked
                ? "1px solid rgba(245,245,245,0.05)"
                : "1px solid rgba(212,175,55,0.25)",
            }}
          >
            {isLocked ? (
              <Lock size={18} className="text-[rgba(245,245,245,0.2)]" />
            ) : (
              <Crown
                size={18}
                className="text-[#D4AF37]"
                style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.5))" }}
              />
            )}
          </div>
          <div>
            <p
              className={`text-xs font-black uppercase tracking-wider ${
                isLocked ? "text-[rgba(245,245,245,0.3)]" : "text-[#F5F5F5]"
              }`}
            >
              VIP {level}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[rgba(245,245,245,0.35)] mt-0.5">
              Min ${minBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-base font-black tabular-nums ${
              isLocked ? "text-[rgba(245,245,245,0.2)]" : "text-[#38A169]"
            }`}
          >
            {commissionRate.toFixed(1)}%
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.35)] mt-0.5">
            Commission
          </p>
        </div>
      </div>
    </motion.button>
  );
}
