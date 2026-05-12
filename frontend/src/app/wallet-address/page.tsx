"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Save, Smartphone, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function WalletAddress() {
  const router = useRouter();
  const { user, token, setUser } = useAuthStore();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const isLocked = !!user?.withdrawalAddress;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.withdrawalAddress) {
      setAddress(user.withdrawalAddress);
    }
  }, [token, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    if (!address || address.length < 10) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put("/user/withdrawal-address", { address });
      if (data.success) {
        toast.success("Wallet address saved and locked");
        const updatedUser = { ...user, withdrawalAddress: address };
        setUser(updatedUser as any);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen luxury-bg pb-28 font-sans relative overflow-hidden">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-60 -left-40 opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between relative z-10">
        <button 
          onClick={() => router.back()} 
          className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all"
          style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }}
        >
          <ArrowLeft size={20} className="text-[rgba(245,245,245,0.6)]" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#F5F5F5]">Wallet Settings</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="px-6 space-y-6 relative z-10 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-glass rounded-[32px] p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <CreditCard className="text-[#D4AF37]" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#F5F5F5] uppercase tracking-wider">Secure Wallet</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                {isLocked ? "Your address is permanently locked" : "Set your default USDT-TRC20 address"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.4)] block ml-1">
                USDT-TRC20 Wallet Address
              </label>
              <div className="relative">
                <Smartphone className={`absolute left-5 top-1/2 -translate-y-1/2 ${isLocked ? 'text-white/20' : 'text-[#D4AF37]/50'}`} size={18} />
                <input
                  type="text"
                  placeholder="Paste your TRC20 address here"
                  value={address}
                  onChange={(e) => !isLocked && setAddress(e.target.value)}
                  readOnly={isLocked}
                  className={`input-gold w-full rounded-2xl py-5 pl-12 pr-5 text-xs font-bold transition-all ${isLocked ? 'opacity-50 grayscale bg-black/40 border-white/5 cursor-not-allowed' : ''}`}
                />
                {isLocked && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20">
                    <Lock size={12} />
                    Locked
                  </div>
                )}
              </div>
              <p className="text-[9px] font-medium text-white/30 italic ml-1 leading-relaxed">
                {isLocked 
                  ? (
                    <span>
                      * For security reasons, withdrawal addresses cannot be changed once saved. 
                      <button onClick={() => router.push("?chat=true")} className="text-[#D4AF37] font-bold ml-1 hover:underline">Contact support</button> if you need assistance.
                    </span>
                  )
                  : "* Please double check your address. Transactions on TRC20 are irreversible and this address will be locked after saving."
                }
              </p>
            </div>

            {!isLocked && (
              <button 
                type="submit" 
                disabled={loading}
                className="btn-gold w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(212,175,55,0.3)]"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save & Lock Address</span>
                  </>
                )}
              </button>
            )}
          </form>
        </motion.div>

        {isLocked && (
          <div className="p-6 rounded-[24px] bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-start gap-4">
            <Lock className="text-[#D4AF37] shrink-0" size={16} />
            <p className="text-[10px] leading-relaxed text-[#D4AF37]/80 font-medium uppercase tracking-wider">
              This address is now set as your permanent withdrawal destination. All withdrawal requests will be automatically sent to this wallet for your security.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
