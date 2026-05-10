"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How to recharge?",
      answer: "Go to the Home page and click on the \"Recharge\" button. Select your preferred payment method and follow the instructions."
    },
    {
      question: "How to withdraw?",
      answer: "Navigate to the Profile page, click on \"Deposit/Withdrawal\" or \"Withdrawal\", then follow the instructions. Enter the amount and your withdrawal password."
    },
    {
      question: "What is order grabbing?",
      answer: "Order grabbing is a task where you help merchants increase their sales volume. You receive a commission for each order you grab."
    },
    {
      question: "How to upgrade VIP level?",
      answer: "VIP levels are upgraded based on your total balance or total task volume. Check the VIP section in the Menu for specific requirements."
    }
  ];

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
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#F5F5F5]">FAQs</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="px-6 space-y-4 relative z-10 mt-4">
        
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
              className="luxury-glass rounded-[24px] overflow-hidden"
              style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.15)" }}>
              
              <button 
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#F5F5F5] pr-4 leading-relaxed">{faq.question}</h3>
                <motion.div 
                  animate={{ rotate: isOpen ? 180 : 0 }} 
                  transition={{ duration: 0.3 }}
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-white/5 border border-white/10"
                >
                  <ChevronDown size={16} className={isOpen ? "text-[#D4AF37]" : "text-[rgba(245,245,245,0.5)]"} />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-5 pb-5 pt-1">
                      <div className="w-full h-px bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-transparent mb-4" />
                      <p className="text-[10px] text-[rgba(245,245,245,0.6)] font-medium leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}

      </main>
    </div>
  );
}
