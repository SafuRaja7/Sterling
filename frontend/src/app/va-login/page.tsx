"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Eye, EyeOff, ArrowRight, Briefcase, Clock, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function VALogin() {
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [pendingApproval, setPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Credentials Required");
      return;
    }
    setLoading(true);
    setPendingApproval(false);
    
    try {
      const { data } = await api.post("/va-auth/login", formData);
      
      if (data.status === 'pending') {
        setPendingApproval(true);
        toast.success("Login request sent to Admin");
      } else {
        loginAction(data.data, data.data.token);
        toast.success("VA Access Granted");
        router.push("/admin");
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Access Denied";
      toast.error(msg);
      if (msg === "Access Denied") {
        // This means admin rejected the request
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen luxury-bg relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-60 -right-40 opacity-25" style={{ background: "rgba(49,130,206,0.3)" }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="h-24 w-24 mx-auto mb-6 flex items-center justify-center relative overflow-hidden"
            style={{
              maskImage: "radial-gradient(circle at center, black 40%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 40%, transparent 75%)"
            }}
          >
            <img 
              src="/images/icons/shopify.png" 
              alt="Logo" 
              className="w-full h-[140%] object-contain object-top drop-shadow-[0_15px_30px_rgba(212,175,55,0.4)]" 
              style={{ 
                mixBlendMode: "screen",
                filter: "contrast(1.2) brightness(1.1)"
              }}
            />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tighter text-[#F5F5F5] mb-2 uppercase">
            VA <span className="text-gold-gradient">Control</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)]">
            Official Personnel Access
          </p>
        </div>

        {/* Card */}
        <div className="luxury-glass rounded-[40px] p-8 border border-white/5">
          <AnimatePresence mode="wait">
            {!pendingApproval ? (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] group-focus-within:text-[#D4AF37] transition-all duration-300">
                    <User size={18} />
                  </div>
                  <input type="text" placeholder="VA Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-gold w-full rounded-2xl py-4 pl-12 pr-5 text-sm font-semibold" />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] group-focus-within:text-[#D4AF37] transition-all duration-300">
                    <Lock size={18} />
                  </div>
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-gold w-full rounded-2xl py-4 pl-12 pr-12 text-sm font-semibold" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] hover:text-[#D4AF37]">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-2xl flex items-center justify-center gap-3 mt-2">
                  {loading ? <div className="w-5 h-5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" /> : <><ArrowRight size={18} /><span>Request Entry</span></>}
                </button>
              </motion.form>
            ) : (
              <motion.div key="pending" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                <div className="h-20 w-20 rounded-full bg-white/5 border border-[#D4AF37]/30 mx-auto flex items-center justify-center animate-pulse">
                  <Clock size={40} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Access Pending</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                    Your login request has been sent to the Master Admin.<br/>Please wait for authorization.
                  </p>
                </div>
                <button onClick={() => setPendingApproval(false)} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] hover:underline">
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[rgba(245,245,245,0.2)]">
          <AlertCircle size={14} />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
            Unauthorized access is strictly monitored
          </p>
        </div>
      </motion.div>
    </div>
  );
}
