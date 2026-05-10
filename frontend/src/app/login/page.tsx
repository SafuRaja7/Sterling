"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Credentials Required");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", formData);
      loginAction(data.data, data.data.token);
      toast.success("Access Granted");
      if (data.data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Access Denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen luxury-bg relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-60 -right-40 opacity-25" />
      <div className="luxury-bg-orb w-[400px] h-[400px] -bottom-40 -left-20 opacity-15" style={{ animationDelay: "2s" }} />
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
            className="h-20 w-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F0D060 100%)",
              boxShadow: "0 16px 48px rgba(212,175,55,0.35)",
            }}
          >
            <Shield size={36} className="text-[#0D0D0D]" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-[#F5F5F5] mb-2">
            Welcome <span className="text-gold-gradient">Back</span>
          </h1>
          <div className="gold-divider w-32 mx-auto my-4" />
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)]">
            Secure Member Access
          </p>
        </div>

        {/* Card */}
        <div className="luxury-glass rounded-[40px] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] group-focus-within:text-[#D4AF37] transition-all duration-300">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Username"
                className="input-gold w-full rounded-2xl py-4 pl-12 pr-5 text-sm font-semibold"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] group-focus-within:text-[#D4AF37] transition-all duration-300">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="input-gold w-full rounded-2xl py-4 pl-12 pr-12 text-sm font-semibold"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] hover:text-[#D4AF37] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 rounded-2xl flex items-center justify-center gap-3 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="gold-divider mt-8 mb-6" />

          <p className="text-center text-[12px] text-[rgba(245,245,245,0.4)] font-medium">
            No account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-[#D4AF37] font-black uppercase tracking-widest ml-1 hover:text-[#F0D060] transition-colors"
            >
              Register
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[rgba(245,245,245,0.2)] mt-8">
          Military-Grade Encrypted Platform
        </p>
      </motion.div>
    </div>
  );
}
