"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock,
  CheckCircle, XCircle, Copy, RefreshCw, Smartphone, Image as ImageIcon,
  ShieldCheck, Wallet as WalletIcon, History, AlertCircle, MessageSquare, Sparkles
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F5E0A0 100%)";

export default function Wallet() {
  const router = useRouter();
  const { user, token, logout, _hasHydrated } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const PAYMENT_ADDRESS = "TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo";

  useEffect(() => {
    if (_hasHydrated) {
      if (!token) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [_hasHydrated, token, router]);

  useEffect(() => {
    if (activeTab === "withdraw" && user?.withdrawalAddress) {
      setAddress(user.withdrawalAddress);
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, txRes] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/transactions"),
      ]);
      useAuthStore.getState().setUser(profileRes.data.data);
      setTransactions(txRes.data.data || []);
    } catch (err: any) {
      console.error("Wallet fetch error:", err);
      if (err.response?.status === 401) {
        setModalError("Please login again.");
        logout(); router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PAYMENT_ADDRESS);
    toast.success("Address copied", { position: "top-center" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setScreenshot(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setModalError("Please enter a valid amount."); return; }
    
    if (activeTab === "deposit" && !screenshot) {
      setModalError("Please upload payment proof.");
      return;
    }

    if (activeTab === "withdraw" && (!address || address.length < 10)) {
      setModalError("Please enter a valid TRC20 address.");
      return;
    }

    if (activeTab === "withdraw" && parseFloat(amount) > (user?.balance ?? 0)) {
      setModalError("Insufficient balance.");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = "";
      if (activeTab === "deposit" && screenshot) {
        const formData = new FormData();
        formData.append("image", screenshot);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.success) screenshotUrl = uploadRes.data.url;
        else throw new Error("Upload failed");
      }

      const payload = activeTab === "deposit" 
        ? { amount: parseFloat(amount), screenshot: screenshotUrl }
        : { amount: parseFloat(amount), address };

      await api.post(`/user/${activeTab}`, payload);
      
      setSuccessMessage(`${activeTab === "deposit" ? "Deposit" : "Withdraw"} request submitted. It will be processed soon.`);
      setAmount("");
      setScreenshot(null);
      fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-32 font-sans relative overflow-hidden">
      {/* Subtle Yellow Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-20%] w-[60%] h-[30%] bg-[#D4AF37]/3 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="px-8 pt-16 pb-10 flex items-center justify-between relative z-10">
        <button onClick={() => router.back()} className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4AF37]/10 transition-all shadow-xl">
          <ArrowLeft size={24} className="text-[#D4AF37]/60" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60 mb-1">Wallet</p>
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">My <span className="text-[#D4AF37]">Vault</span></h1>
        </div>
        <button onClick={fetchData} className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4AF37]/10 transition-all shadow-xl">
          <RefreshCw size={20} className="text-[#D4AF37]/60" />
        </button>
      </header>

      <main className="px-8 space-y-10 relative z-10">
        
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[40px] p-10 relative overflow-hidden bg-[#D4AF37]/5 border border-[#D4AF37]/10 shadow-2xl"
        >
          <div className="absolute -right-10 -top-10 opacity-[0.02]">
            <WalletIcon size={160} className="text-[#D4AF37]" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#38A169]" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/60">Total Balance</p>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">
              ${(user.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="pt-4 border-t border-[#D4AF37]/5">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10 text-center">Funds are safely processed</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex rounded-3xl p-1.5 bg-white/5 border border-white/5 shadow-2xl backdrop-blur-xl">
          {(["deposit", "withdraw"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden ${
                activeTab === tab ? "text-black" : "text-[#D4AF37]/40 hover:text-[#D4AF37]"
              }`}
            >
              {activeTab === tab && (
                <motion.div layoutId="walletTab" className="absolute inset-0 bg-gold-gradient shadow-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab === "deposit" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                {tab}
              </span>
            </button>
          ))}
        </div>

        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-[40px] p-10 bg-black/40 border border-[#D4AF37]/10 shadow-2xl relative overflow-hidden"
        >
          {activeTab === "deposit" && (
            <div className="mb-10 text-center">
              <div className="p-8 rounded-3xl bg-black/40 border border-[#D4AF37]/5 relative shadow-inner mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/40 mb-6">Deposit Address (USDT-TRC20)</p>
                <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-xl border-4 border-[#D4AF37]/10">
                  <QRCodeCanvas value={PAYMENT_ADDRESS} size={160} />
                </div>
                <div className="flex items-center gap-4 bg-black/60 px-6 py-4 rounded-2xl border border-[#D4AF37]/20 shadow-xl">
                  <p className="text-[12px] font-mono text-[#D4AF37]/60 truncate flex-1 tracking-wider">{PAYMENT_ADDRESS}</p>
                  <button onClick={copyAddress} className="h-10 w-10 rounded-xl bg-gold-gradient text-black flex items-center justify-center shadow-lg">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/60 ml-2">Amount (USD)</label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37] font-black text-2xl">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-3xl py-6 pl-14 pr-8 bg-white/[0.03] border border-white/5 text-2xl font-black tabular-nums text-white outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-white/5"
                />
              </div>
              
              {activeTab === "withdraw" && amount && parseFloat(amount) > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3 shadow-xl">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
                    <span>Fee (5%)</span>
                    <span className="text-[#E53E3E]">-${(parseFloat(amount) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Received</span>
                    <span className="text-xl font-black text-[#38A169]">${(parseFloat(amount) * 0.95).toFixed(2)}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {activeTab === "withdraw" && (
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/60 ml-2">TRC20 Address</label>
                <div className="relative group">
                  <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]/20" size={20} />
                  <input
                    type="text"
                    placeholder="Enter TRC20 address"
                    value={address}
                    readOnly={!!user?.withdrawalAddress}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full rounded-3xl py-6 pl-14 pr-8 bg-white/[0.03] border border-white/5 text-[13px] font-bold text-white outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-white/5 ${user?.withdrawalAddress ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
            )}

            {activeTab === "deposit" && (
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/60 ml-2">Payment Proof</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="screenshot-upload" />
                <label htmlFor="screenshot-upload" className="flex flex-col items-center justify-center gap-4 w-full py-10 rounded-3xl border border-dashed border-[#D4AF37]/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                  {screenshot ? (
                    <div className="text-center text-[#38A169]">
                      <CheckCircle size={32} className="mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{screenshot.name.slice(0, 20)}...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={28} className="text-[#D4AF37]/40" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/40">Upload Screenshot</span>
                    </>
                  )}
                </label>
              </div>
            )}

            <button type="submit" disabled={submitting} className="h-20 w-full rounded-3xl flex items-center justify-center gap-4 bg-gold-gradient text-black font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
              {submitting ? (
                <div className="w-6 h-6 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <span>{activeTab === "deposit" ? "Deposit" : "Withdraw"}</span>
              )}
            </button>
          </form>
        </motion.div>

        {/* History */}
        <div className="space-y-6 pb-10">
          <div className="flex items-center gap-3 px-2">
            <div className="h-5 w-1 bg-[#D4AF37]/40 rounded-full" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/60">Transaction History</h3>
          </div>
          
          {transactions.length === 0 ? (
            <div className="rounded-[40px] p-16 text-center bg-black/40 border border-white/5">
              <History size={40} className="mx-auto text-white/5 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/10">No transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-3xl p-6 bg-white/5 border border-white/5 shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                      tx.type === "deposit" ? "bg-[#38A169]/10 text-[#38A169]" : "bg-[#E53E3E]/10 text-[#E53E3E]"
                    }`}>
                      {tx.type === "deposit" ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-white uppercase tracking-wider">{tx.type}</p>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
                        {new Date(tx.createdAt || tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tabular-nums ${tx.type === "deposit" ? "text-[#38A169]" : "text-[#E53E3E]"}`}>
                      {tx.type === "deposit" ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      tx.status === 'approved' ? 'text-[#38A169]' : tx.status === 'rejected' ? 'text-[#E53E3E]' : 'text-[#D4AF37]'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      <AnimatePresence>
        {(modalError || successMessage) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              className={`w-full max-w-sm rounded-[50px] p-10 text-center relative overflow-hidden border shadow-2xl ${
                modalError ? 'bg-[#0D0D0D] border-[#E53E3E]/20' : 'bg-[#0D0D0D] border-[#D4AF37]/20'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-20" />
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 ${
                modalError ? 'bg-[#E53E3E]/10 text-[#E53E3E]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
              }`}>
                {modalError ? <AlertCircle size={40} /> : <CheckCircle size={40} />}
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{modalError ? 'Failed' : 'Success'}</h3>
              <p className="text-[13px] font-medium text-white/40 leading-relaxed mb-8 px-4">{modalError || successMessage}</p>
              <button onClick={() => { setModalError(null); setSuccessMessage(null); }} className="h-16 w-full rounded-3xl bg-gold-gradient text-black font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">OK</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .bg-gold-gradient { background: ${GOLDEN_GRADIENT}; }
      `}</style>
    </div>
  );
}