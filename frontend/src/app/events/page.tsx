"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, Calendar, Sparkles, ChevronRight } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();

  const events = [
    {
      title: "Global Merchants Summit",
      date: "Dec 15, 2026",
      location: "London, UK",
      description: "Annual gathering of top tier merchants and digital commerce innovators.",
      image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "New Era of AI Commerce",
      date: "Jan 20, 2027",
      location: "Singapore",
      description: "Exploring the integration of AI in cross-border Shopify markets.",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="px-8 py-10 flex items-center justify-between relative z-10 border-b border-[#D4AF37]/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-[#D4AF37]" />
          <h1 className="text-sm font-black uppercase tracking-[0.4em] text-white">Platform Events</h1>
        </div>
        <button onClick={() => router.back()} className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all bg-white/5 border border-white/10 hover:bg-[#D4AF37]/10">
          <X size={20} className="text-white/60" />
        </button>
      </header>

      <main className="flex-1 px-8 py-12 relative z-10 space-y-8 overflow-y-auto">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">Institutional Events</h2>
          <p className="text-[12px] font-medium text-white/20 uppercase tracking-[0.2em]">Exclusive gatherings for our premium merchant network.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {events.map((event, i) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-[40px] overflow-hidden border border-[#D4AF37]/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img src={event.image} alt="" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                    <Sparkles size={12} className="text-[#D4AF37]" />
                    <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">{event.date}</span>
                  </div>
                  <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{event.location}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{event.title}</h3>
                  <p className="text-[12px] text-white/40 leading-relaxed uppercase tracking-widest">{event.description}</p>
                </div>
                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-2 group">
                  Register Interest <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
