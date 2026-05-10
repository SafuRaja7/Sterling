"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock,
  CheckCircle, XCircle, Copy, RefreshCw, Smartphone, Image
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";

export default function Wallet() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const PAYMENT_ADDRESS = "TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo";

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, [token]);

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
      toast.error(err.response?.data?.message || "Session error");
      logout(); router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PAYMENT_ADDRESS);
    toast.success("Address copied to clipboard");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setScreenshot(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter valid amount"); return; }
    
    if (activeTab === "deposit" && !screenshot) {
      toast.error("Please upload payment proof screenshot");
      return;
    }

    if (activeTab === "withdraw" && (!address || address.length < 10)) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    if (activeTab === "withdraw" && parseFloat(amount) > (user?.balance ?? 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = "";
      
      // 1. If it's a deposit, upload screenshot first
      if (activeTab === "deposit" && screenshot) {
        const formData = new FormData();
        formData.append("image", screenshot);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.success) {
          screenshotUrl = uploadRes.data.url;
        } else {
          throw new Error("Screenshot upload failed");
        }
      }

      // 2. Submit transaction request
      const payload = activeTab === "deposit" 
        ? { amount: parseFloat(amount), screenshot: screenshotUrl }
        : { amount: parseFloat(amount), address };

      await api.post(`/user/${activeTab}`, payload);
      
      toast.success(`${activeTab === "deposit" ? "Deposit" : "Withdrawal"} request submitted for verification`);
      setAmount("");
      setScreenshot(null);
      fetchData();
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.response?.data?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={14} className="text-green-500" />;
    if (status === "rejected") return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-[#D4AF37]" />;
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "text-green-500";
    if (status === "rejected") return "text-red-500";
    return "text-[#D4AF37]";
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-bg pb-28 font-sans relative overflow-hidden">
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-60 -left-40 opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between relative z-10">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all"
          style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }}>
          <ArrowLeft size={20} className="text-[rgba(245,245,245,0.6)]" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#F5F5F5]">Vault</h1>
        <button onClick={fetchData} className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all hover:border-[#D4AF37]/40"
          style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }}>
          <RefreshCw size={16} className="text-[rgba(245,245,245,0.5)]" />
        </button>
      </header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1A1A1A 0%, #252525 100%)",
            border: "1px solid rgba(212,175,55,0.25)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)] mb-2">Available Balance</p>
          <h2 className="text-4xl font-black text-gold-gradient tabular-nums">
            ${(user.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1" style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.06)" }}>
          {(["deposit", "withdraw"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === tab ? "text-[#0D0D0D]" : "text-[rgba(245,245,245,0.4)] hover:text-[rgba(245,245,245,0.7)]"
              }`}
              style={activeTab === tab ? {
                background: "linear-gradient(135deg, #A08020, #D4AF37, #F0D060)",
                boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
              } : {}}>
              {tab === "deposit" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="luxury-glass rounded-[32px] p-8">
          
          {activeTab === "deposit" && (
            <div className="mb-8 space-y-6">
              <div className="text-center p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(245,245,245,0.4)] mb-4 text-center">
                  Scan QR to Pay (USDT-TRC20)
                </p>
                <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <QRCodeCanvas value={PAYMENT_ADDRESS} size={160} />
                </div>
                
                <div className="flex flex-col items-center gap-2 mt-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Deposit Address</p>
                  <div className="flex items-center gap-3 w-full bg-black/60 px-4 py-3 rounded-xl border border-[#D4AF37]/20">
                    <p className="text-[11px] font-mono text-white/80 truncate flex-1">{PAYMENT_ADDRESS}</p>
                    <button 
                      type="button"
                      onClick={copyAddress}
                      className="p-2 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      <Copy size={14} className="text-[#D4AF37]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.4)] block mb-3">
                {activeTab === "deposit" ? "Amount Deposited (USD)" : "Amount to Withdraw (USD)"}
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37] font-black text-lg">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-gold w-full rounded-2xl py-4 pl-10 pr-5 text-xl font-black tabular-nums"
                />
              </div>
              {activeTab === "withdraw" && amount && parseFloat(amount) > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-white/40">Platform Fee (5%)</span>
                    <span className="text-[#E53E3E]">-${(parseFloat(amount) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest border-t border-white/5 pt-2">
                    <span className="text-white/60">Final Payable</span>
                    <span className="text-green-500">${(parseFloat(amount) * 0.95).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {activeTab === "withdraw" && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.4)] block">
                  Withdrawal Address (USDT-TRC20)
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/50" size={18} />
                  <input
                    type="text"
                    placeholder="Paste your TRC20 address"
                    value={address}
                    readOnly={!!user?.withdrawalAddress}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`input-gold w-full rounded-2xl py-4 pl-12 pr-5 text-xs font-bold ${user?.withdrawalAddress ? 'opacity-50 cursor-not-allowed bg-black/40' : ''}`}
                  />
                  {user?.withdrawalAddress && (
                    <p className="text-[8px] font-bold text-[rgba(245,245,245,0.3)] mt-2 uppercase tracking-widest text-center">
                      Wallet address is locked. Contact support to change.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "deposit" && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.4)] block">
                  Upload Payment Screenshot
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border-2 border-dashed border-[#D4AF37]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-all group"
                  >
                    {screenshot ? (
                      <div className="flex items-center gap-2 text-[#D4AF37]">
                        <CheckCircle size={18} />
                        <span className="text-xs font-bold truncate max-w-[200px]">{screenshot.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[rgba(245,245,245,0.4)] group-hover:text-[rgba(245,245,245,0.6)]">
                        <Image size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Select Screenshot</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="btn-gold w-full py-4 rounded-2xl flex items-center justify-center gap-3">
              {submitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" />
              ) : (
                <>{activeTab === "deposit" ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  Submit {activeTab === "deposit" ? "Deposit" : "Withdrawal"}</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Transaction History */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(245,245,245,0.4)] mb-4">Transaction History</p>
          {transactions.length === 0 ? (
            <div className="rounded-[24px] p-12 text-center" style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.05)" }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[rgba(245,245,245,0.2)]">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <motion.div key={tx.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between rounded-[20px] p-5"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.05)" }}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center"
                      style={{ background: tx.type === "deposit" ? "rgba(56,161,105,0.1)" : "rgba(229,62,62,0.1)", border: `1px solid ${tx.type === "deposit" ? "rgba(56,161,105,0.2)" : "rgba(229,62,62,0.2)"}` }}>
                      {tx.type === "deposit" ? <ArrowUpRight size={16} className="text-green-500" /> : <ArrowDownLeft size={16} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[#F5F5F5] uppercase tracking-wider">{tx.type}</p>
                      <p className="text-[9px] font-bold text-[rgba(245,245,245,0.35)] mt-0.5">
                        {new Date(tx.createdAt || tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tabular-nums ${tx.type === "deposit" ? "text-green-500" : "text-red-500"}`}>
                      {tx.type === "deposit" ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] font-black uppercase tracking-widest ${statusColor(tx.status)}`}>
                      {statusIcon(tx.status)}
                      {tx.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}