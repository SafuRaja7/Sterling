"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Gift, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F5E0A0 100%)";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    inviteCode: inviteCode || "",
  });

  useEffect(() => {
    if (inviteCode) setFormData(prev => ({ ...prev, inviteCode }));
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      setModalError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      toast.success("Registration Successful", { position: "top-center" });
      router.push("/login");
    } catch (error: any) {
      setModalError(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-md relative z-10"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-28 w-28 mx-auto mb-6 flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-gold-gradient blur-2xl opacity-20" />
          <div className="relative h-24 w-24 rounded-[32px] bg-black/60 border border-white/5 flex items-center justify-center p-4 backdrop-blur-xl shadow-2xl">
             <img src="/images/icons/shopify.png" alt="Sterling" className="w-full h-full object-contain" />
          </div>
        </motion.div>
        
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">
          Create <span className="text-gold-gradient">Account</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]/60">
          Register
        </p>
      </div>

      <div className="rounded-[50px] p-1 bg-gradient-to-b from-white/10 to-transparent">
        <div className="rounded-[49px] p-10 bg-[#0A0A0A] backdrop-blur-3xl shadow-2xl space-y-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full rounded-[24px] py-5 pl-14 pr-8 bg-white/[0.03] border border-white/5 text-[12px] font-bold text-white outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.06] transition-all placeholder:text-white/5"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-[24px] py-5 pl-14 pr-8 bg-white/[0.03] border border-white/5 text-[12px] font-bold text-white outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.06] transition-all placeholder:text-white/5"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full rounded-[24px] py-5 pl-14 pr-14 bg-white/[0.03] border border-white/5 text-[12px] font-bold text-white outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.06] transition-all placeholder:text-white/5"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#D4AF37] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative group">
                <Gift className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Referral Code (Optional)"
                  className="w-full rounded-[24px] py-5 pl-14 pr-8 bg-white/[0.03] border border-white/5 text-[12px] font-bold text-white outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.06] transition-all placeholder:text-white/5"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-16 w-full rounded-[24px] flex items-center justify-center gap-4 bg-gold-gradient text-black font-black uppercase text-xs tracking-[0.2em] shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <>
                  <span>Register</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="h-px w-20 bg-white/5" />
            <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest text-center">
              Already a member?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-[#D4AF37] font-black ml-1 hover:text-[#F5E0A0] transition-colors"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalError && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              className="w-full max-w-sm rounded-[50px] p-10 text-center relative overflow-hidden border border-[#E53E3E]/20 bg-[#0D0D0D] shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gold-gradient opacity-10" />
              <div className="w-24 h-24 rounded-[35px] flex items-center justify-center mx-auto mb-8 bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E]">
                <AlertCircle size={48} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Failed</h3>
              <p className="text-[13px] font-medium text-white/40 leading-relaxed mb-10 px-4">{modalError}</p>
              <button onClick={() => setModalError(null)} className="h-16 w-full rounded-3xl bg-gold-gradient text-black font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Try Again</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Register() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center p-8 font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[100%] h-[50%] bg-[#D4AF37]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] bg-blue-500/3 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-30" />
      
      <Suspense fallback={
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/10 border-t-[#D4AF37] animate-spin" />
      }>
        <RegisterContent />
      </Suspense>

      <style jsx global>{`
        .bg-gold-gradient { background: ${GOLDEN_GRADIENT}; }
      `}</style>
    </div>
  );
}
