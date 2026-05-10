"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_DATA = [
  { country: "SG", user: "U....98", amount: 35.00 },
  { country: "UK", user: "U....12", amount: 85.00 },
  { country: "AE", user: "U....45", amount: 115.00 },
  { country: "US", user: "U....09", amount: 275.00 },
  { country: "CA", user: "U....77", amount: 987.00 },
  { country: "CH", user: "U....33", amount: 1450.50 },
  { country: "FR", user: "U....61", amount: 2100.00 },
  { country: "DE", user: "U....22", amount: 3340.20 },
  { country: "JP", user: "U....88", amount: 4210.00 },
  { country: "AU", user: "U....54", amount: 4958.00 },
];

export default function GlobalActivity() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        let next = Math.floor(Math.random() * MOCK_DATA.length);
        while (next === prev) {
          next = Math.floor(Math.random() * MOCK_DATA.length);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const data = MOCK_DATA[index];

  return (
    <div className="luxury-glass rounded-[24px] p-4 relative overflow-hidden border border-[rgba(212,175,55,0.15)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Global Activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38A169] animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#38A169]">Live</span>
        </div>
      </div>

      <div className="relative h-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-between bg-black/20 rounded-xl px-4 border border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                <span className="text-[10px] font-black text-[#D4AF37]">{data.country}</span>
              </div>
              <span className="text-xs font-bold text-white/60 tracking-tight">{data.user}</span>
            </div>
            
            <div className="text-right">
              <p className="text-xs font-black text-[#38A169] tabular-nums tracking-wide">
                +${data.amount.toFixed(2)}
              </p>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                Just matched
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
    </div>
  );
}
