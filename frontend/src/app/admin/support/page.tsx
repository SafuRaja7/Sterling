"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, CheckCircle2, MessageSquare,
  User as UserIcon, ShieldCheck, Clock, ArrowLeft, RefreshCw,
  Trash2, XCircle, ExternalLink, ShieldAlert, BadgeCheck,
  ChevronRight, MoreVertical
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020 0%, #D4AF37 50%, #F5E0A0 100%)";

interface Thread {
  id: string;
  user_id: string;
  status: "open" | "resolved";
  unread_admin_count: number;
  last_message_at: string;
  users: { 
    username: string; 
    vip_level: number;
    balance?: number;
  };
}

interface Message {
  id: string;
  message: string;
  sender_type: "user" | "admin" | "system";
  created_at: string;
  is_read: boolean;
}

export default function AdminSupport() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        try {
          const { data } = await api.get("/va-auth/me");
          if (data.success) {
            useAuthStore.getState().setUser(data.data);
          } else {
            router.push("/login");
          }
        } catch {
          router.push("/login");
        }
      }
    };
    init();
  }, [token, user, router]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user !== null) {
      const isAuthorized = user?.role === "admin" || user?.role === "va";
      if (!isAuthorized) { router.push("/login"); return; }
      fetchThreads();
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
      socketRef.current = io(socketUrl);
      socketRef.current.on("connect", () => { socketRef.current?.emit("join_admin_room"); });
      socketRef.current.on("new_support_message", (data: any) => {
        setThreads((prev) => {
          const idx = prev.findIndex(t => t.id === data.threadId);
          if (idx === -1) { fetchThreads(); return prev; }
          const next = [...prev];
          next[idx] = { 
            ...next[idx], 
            last_message_at: data.message.created_at, 
            unread_admin_count: (next[idx].unread_admin_count || 0) + 1 
          };
          const [t] = next.splice(idx, 1);
          return [t, ...next];
        });
        if (selectedThread?.id === data.threadId) setMessages(p => [...p, data.message]);
      });
    }
    return () => { socketRef.current?.disconnect(); };
  }, [token, user, selectedThread, router]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/chats");
      if (data.success) setThreads(data.data);
    } catch (err: any) { 
      toast.error("Failed to load chats");
      if (err.response?.status === 401) {
        useAuthStore.getState().logout();
        router.push("/login");
      }
    } finally { setLoading(false); }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      setMsgLoading(true);
      const { data } = await api.get(`/admin/chats/${threadId}/messages`);
      if (data.success) {
        setMessages(data.data);
        setThreads(p => p.map(t => t.id === threadId ? { ...t, unread_admin_count: 0 } : t));
      }
    } catch (err: any) { 
      toast.error("Failed to load messages"); 
    } finally { setMsgLoading(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;
    const content = newMessage.trim();
    setNewMessage("");
    try {
      const { data } = await api.post(`/admin/chats/${selectedThread.id}/message`, { message: content });
      if (data.success) setMessages(p => [...p, data.data]);
    } catch { 
      toast.error("Failed to send"); 
      setNewMessage(content); 
    }
  };

  const toggleResolve = async () => {
    if (!selectedThread) return;
    const newStatus = selectedThread.status === "open" ? "resolved" : "open";
    try {
      const { data } = await api.put(`/admin/chats/${selectedThread.id}/resolve`, { status: newStatus });
      if (data.success) {
        setSelectedThread({ ...selectedThread, status: newStatus });
        setThreads(p => p.map(t => t.id === selectedThread.id ? { ...t, status: newStatus } : t));
        toast.success(`Marked as ${newStatus}`);
      }
    } catch { toast.error("Failed to update status"); }
  };

  const handleDeleteThread = async () => {
    if (!threadToDelete) return;
    try {
      const { data } = await api.delete(`/admin/chats/${threadToDelete.id}`);
      if (data.success) {
        toast.success("Thread deleted permanently");
        setThreads(p => p.filter(t => t.id !== threadToDelete.id));
        if (selectedThread?.id === threadToDelete.id) setSelectedThread(null);
        setThreadToDelete(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete thread");
    }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const filtered = threads.filter(t => t.users.username.toLowerCase().includes(search.toLowerCase()));

  const openCount = threads.filter(t => t.status === 'open').length;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex overflow-hidden font-sans selection:bg-[#D4AF37]/30">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/3 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row h-screen relative z-10">
        
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`w-full md:w-[380px] flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl ${selectedThread ? "hidden md:flex" : "flex"}`}
        >
          {/* Header */}
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-[18px] bg-gold-gradient flex items-center justify-center shadow-[0_8px_20px_rgba(212,175,55,0.3)]">
                  <MessageSquare size={20} className="text-black" />
                </div>
                <div>
                  <h1 className="font-black text-xs uppercase tracking-[0.3em] text-white">Support <span className="text-[#D4AF37]">Hub</span></h1>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Command Center</p>
                </div>
              </div>
              <button onClick={() => router.push("/admin")} className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all">
                <ArrowLeft size={18} className="text-white/40" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Open Cases</p>
                <p className="text-lg font-black text-[#38A169]">{openCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Resolved</p>
                <p className="text-lg font-black text-[#D4AF37]">{threads.length - openCount}</p>
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Find customer..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 pl-12 pr-6 text-sm font-bold text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37]/30 focus:bg-white/[0.08] transition-all" 
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto luxury-scrollbar px-4 pb-8 space-y-2">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-20">
                <RefreshCw size={32} className="animate-spin text-[#D4AF37]" />
                <p className="text-[10px] font-black uppercase tracking-widest">Encrypting Hub...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center opacity-10 space-y-4">
                <MessageSquare size={48} className="mx-auto" />
                <p className="font-black text-[10px] uppercase tracking-widest">Digital Silence</p>
              </div>
            ) : (
              filtered.map(thread => (
                <div key={thread.id} className="relative group">
                  <button 
                    onClick={() => { setSelectedThread(thread); fetchMessages(thread.id); }}
                    className={`w-full p-5 rounded-[28px] flex items-center gap-4 transition-all relative overflow-hidden border ${
                      selectedThread?.id === thread.id 
                        ? "bg-white/[0.08] border-[#D4AF37]/30 shadow-lg" 
                        : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/5"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm bg-white/5 border border-white/10 text-[#D4AF37]">
                        {thread.users.username[0].toUpperCase()}
                      </div>
                      {thread.status === 'open' && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#38A169] border-2 border-[#050505] shadow-[0_0_10px_rgba(56,161,105,0.5)]" />
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white truncate uppercase tracking-tight">{thread.users.username}</span>
                        <span className="text-[8px] font-bold text-white/20 uppercase">
                          {new Date(thread.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">V{thread.users.vip_level}</p>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <p className="text-[9px] font-bold text-[#38A169] tracking-tighter">${(thread.users.balance || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {thread.unread_admin_count > 0 && (
                      <div className="h-6 min-w-[24px] px-1.5 rounded-full bg-[#E53E3E] flex items-center justify-center text-[9px] font-black text-white shadow-[0_4px_12px_rgba(229,62,62,0.4)] animate-pulse">
                        {thread.unread_admin_count}
                      </div>
                    )}
                  </button>

                  {/* Quick Delete Action */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setThreadToDelete(thread); }}
                    className="absolute right-2 top-2 h-8 w-8 rounded-xl bg-[#E53E3E]/0 text-[#E53E3E]/0 group-hover:bg-[#E53E3E]/10 group-hover:text-[#E53E3E] transition-all flex items-center justify-center z-20 border border-transparent hover:border-[#E53E3E]/30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col relative ${!selectedThread ? "hidden md:flex items-center justify-center" : "flex"}`}>
          {!selectedThread ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="h-24 w-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto shadow-2xl">
                <MessageSquare size={40} className="text-[#D4AF37]/20" />
              </div>
              <div>
                <p className="font-black text-[12px] uppercase tracking-[0.5em] text-white/10">Initialize Encrypted Connection</p>
                <p className="text-[9px] font-bold text-white/5 uppercase tracking-widest mt-2">Select a frequency to begin transmission</p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="h-[100px] px-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-5">
                  <button onClick={() => setSelectedThread(null)} className="md:hidden h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center mr-2">
                    <ArrowLeft size={20} className="text-white/60" />
                  </button>
                  <div className="h-14 w-14 rounded-[22px] bg-gold-gradient flex items-center justify-center shadow-xl shadow-[#D4AF37]/10">
                    <UserIcon size={24} className="text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-black text-base text-white tracking-tight uppercase">{selectedThread.users.username}</h2>
                      <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                        selectedThread.status === 'open' 
                          ? 'bg-[#38A169]/10 text-[#38A169] border-[#38A169]/30' 
                          : 'bg-white/5 text-white/30 border-white/10'
                      }`}>
                        {selectedThread.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                      <span>Ref: {selectedThread.user_id.slice(-12).toUpperCase()}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[#D4AF37]">Tier V{selectedThread.users.vip_level}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[#38A169] font-black">${(selectedThread.users.balance || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleResolve}
                    className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${
                      selectedThread.status === "open"
                        ? "bg-[#38A169]/10 text-[#38A169] border-[#38A169]/20 hover:bg-[#38A169] hover:text-white"
                        : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {selectedThread.status === "open" ? <CheckCircle2 size={14} /> : <RefreshCw size={14} />}
                    {selectedThread.status === "open" ? "Mark Resolved" : "Reopen Hub"}
                  </button>
                  <button 
                    onClick={() => setThreadToDelete(selectedThread)}
                    className="h-12 w-12 rounded-2xl bg-[#E53E3E]/5 border border-[#E53E3E]/10 flex items-center justify-center text-[#E53E3E] hover:bg-[#E53E3E] hover:text-white transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-10 space-y-8 luxury-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {msgLoading ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-10 gap-4">
                    <RefreshCw size={40} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Decrypting Ledger...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-10 gap-4">
                    <ShieldAlert size={60} />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Previous Transmissions</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const sType = msg.sender_type || (msg as any).sender || 'user';
                    const isAdmin = sType === "admin";
                    return (
                      <motion.div 
                        key={msg.id || i} 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[65%] group relative ${isAdmin ? "items-end" : "items-start"}`}>
                          <div className={`relative px-6 py-4 rounded-[32px] shadow-2xl ${
                            isAdmin 
                              ? "bg-gold-gradient text-black rounded-tr-none" 
                              : "bg-[#141414] border border-white/5 text-white rounded-tl-none"
                          }`}>
                            <div className={`flex items-center gap-2 mb-2 opacity-50 ${isAdmin ? "justify-end" : "justify-start"}`}>
                              {isAdmin ? (
                                <>
                                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-black/60">Official Response</span>
                                  <BadgeCheck size={10} className="text-black/60" />
                                </>
                              ) : (
                                <>
                                  <UserIcon size={10} className="text-[#D4AF37]" />
                                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">{selectedThread.users.username}</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm font-medium leading-relaxed tracking-tight">
                              {msg.message}
                            </p>
                            <div className={`mt-3 flex items-center gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                              <p className={`text-[8px] font-bold uppercase tracking-widest opacity-30 ${isAdmin ? "text-black" : "text-white"}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {isAdmin && <CheckCircle2 size={10} className="text-black/30" />}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-8 bg-[#0D0D0D] border-t border-white/5 relative">
                <div className="absolute inset-0 bg-gold-gradient opacity-[0.02] pointer-events-none" />
                <form onSubmit={handleSend} className="relative z-10 flex gap-4 max-w-5xl mx-auto">
                  <div className="flex-1 relative group">
                    <input 
                      type="text" 
                      placeholder="Synthesize reply..." 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full h-16 rounded-[24px] bg-white/5 border border-white/10 pl-8 pr-16 text-sm font-bold text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.08] transition-all shadow-2xl" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 text-white/10 group-focus-within:text-[#D4AF37]/40 transition-colors">
                      <Clock size={16} />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="h-16 w-16 rounded-[24px] flex items-center justify-center flex-shrink-0 disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-[0_15px_35px_rgba(212,175,55,0.2)]"
                    style={{ background: GOLDEN_GRADIENT }}
                  >
                    <Send size={22} className="text-black translate-x-0.5 -translate-y-0.5" />
                  </button>
                </form>
                <div className="flex items-center justify-center gap-8 mt-6 opacity-20">
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em]">
                    <ShieldCheck size={12} className="text-[#D4AF37]" /> Terminal Secure
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em]">
                    <Clock size={12} /> Response Latency: 0.2ms
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {threadToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[40px] p-10 bg-[#0D0D0D] border border-[#E53E3E]/20 shadow-[0_20px_50px_rgba(229,62,62,0.15)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E53E3E] to-transparent opacity-30" />
              <div className="w-24 h-24 rounded-[32px] bg-[#E53E3E]/10 flex items-center justify-center mx-auto mb-8 border border-[#E53E3E]/20">
                <Trash2 size={44} className="text-[#E53E3E]" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">Terminate Feed?</h3>
              <p className="text-[11px] font-medium text-white/40 leading-relaxed mb-10 px-4">
                You are about to permanently purge the transmission history for <span className="text-white font-bold">{threadToDelete.users.username}</span>. This action is final and irreversible.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setThreadToDelete(null)}
                  className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                  Abort
                </button>
                <button 
                  onClick={handleDeleteThread}
                  className="h-14 rounded-2xl bg-[#E53E3E] text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#E53E3E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Purge Data
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .luxury-scrollbar::-webkit-scrollbar { width: 4px; }
        .luxury-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .luxury-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.1); border-radius: 10px; }
        .luxury-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.3); }
        .bg-gold-gradient { background: ${GOLDEN_GRADIENT}; }
      `}</style>
    </div>
  );
}
