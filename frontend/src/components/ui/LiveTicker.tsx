"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Sparkles, TrendingUp } from "lucide-react";

const usernames = ["alex***", "user***", "crypt***", "vipc***", "elite***", "trad***", "king***", "pro***", "gold***", "star***"];
const amounts = [120.50, 450.00, 890.20, 1200.00, 50.00, 2300.40, 670.00, 310.00, 95.50, 5400.00];

export default function LiveTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % usernames.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center">
      <div className="glass px-4 py-2 rounded-full flex items-center gap-3 border-rose-100 shadow-sm">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Globe2 size={12} className="animate-pulse" />
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] font-black uppercase text-slate-900 tracking-tight">
              {usernames[index]}
            </span>
            <div className="h-1 w-1 rounded-full bg-slate-200" />
            <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
              <TrendingUp size={10} />
              +${amounts[index].toFixed(2)} Yield
            </span>
          </motion.div>
        </AnimatePresence>
        
        <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
          <Sparkles className="text-amber-400" size={10} />
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Live</span>
        </div>
      </div>
    </div>
  );
}
