"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, Send, CheckCircle2, MessageSquare,
  User as UserIcon, ShieldCheck, Clock, ArrowLeft, RefreshCw
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Thread {
  id: string;
  user_id: string;
  status: "open" | "resolved";
  unread_admin_count: number;
  last_message_at: string;
  users: { username: string; vip_level: number };
}

interface Message {
  id: string;
  message: string;
  sender_type: "user" | "admin" | "system";
  created_at: string;
  is_read: boolean;
}

function RefreshCwIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>;
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
    // Only check auth when we have determined if there is a user
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
          next[idx] = { ...next[idx], last_message_at: data.message.created_at, unread_admin_count: (next[idx].unread_admin_count || 0) + 1 };
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
    }    finally { setLoading(false); }
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
      if (err.response?.status === 401) {
        useAuthStore.getState().logout();
        router.push("/login");
      }
    }    finally { setMsgLoading(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;
    const content = newMessage.trim();
    setNewMessage("");
    try {
      const { data } = await api.post(`/admin/chats/${selectedThread.id}/message`, { message: content });
      if (data.success) setMessages(p => [...p, data.data]);
    } catch { toast.error("Failed to send"); setNewMessage(content); }
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
    } catch { toast.error("Failed"); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const filtered = threads.filter(t => t.users.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#0D0D0D] text-[#F5F5F5] flex flex-col md:flex-row h-[calc(100vh-72px)] overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50 z-10" />

      {/* Sidebar */}
      <div className={`w-full md:w-72 flex flex-col ${selectedThread ? "hidden md:flex" : "flex"}`}
        style={{ background: "#0D0D0D", borderRight: "1px solid rgba(212,175,55,0.1)" }}>
        {/* Sidebar Header */}
        <div className="p-5 space-y-4" style={{ borderBottom: "1px solid rgba(245,245,245,0.06)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #A08020, #D4AF37)" }}>
                <MessageSquare size={16} className="text-[#0D0D0D]" />
              </div>
              <h1 className="font-black text-[11px] uppercase tracking-[0.2em]">Support Hub</h1>
            </div>
            <button onClick={() => router.push("/admin")} className="h-8 w-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }}>
              <ArrowLeft size={15} className="text-[rgba(245,245,245,0.5)]" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.25)]" size={14} />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-gold w-full rounded-xl py-2.5 pl-9 pr-4 text-xs" />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto luxury-scrollbar">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[rgba(245,245,245,0.2)] font-black text-[10px] uppercase tracking-widest">No conversations</div>
          ) : (
            filtered.map(thread => (
              <button key={thread.id} onClick={() => { setSelectedThread(thread); fetchMessages(thread.id); }}
                className="w-full p-4 flex items-start gap-3 transition-all text-left relative"
                style={{
                  borderBottom: "1px solid rgba(245,245,245,0.04)",
                  background: selectedThread?.id === thread.id 
                    ? "rgba(212,175,55,0.08)" 
                    : thread.unread_admin_count > 0 
                      ? "rgba(56,161,105,0.03)" 
                      : "transparent",
                  borderLeft: selectedThread?.id === thread.id 
                    ? "2px solid #D4AF37" 
                    : thread.unread_admin_count > 0 
                      ? "2px solid #38A169" 
                      : "2px solid transparent",
                }}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37" }}>
                  {thread.users.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#F5F5F5] truncate">{thread.users.username}</span>
                    <span className="text-[9px] font-bold text-[rgba(245,245,245,0.25)] flex-shrink-0 ml-2">
                      {new Date(thread.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">VIP {thread.users.vip_level}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${thread.status === "open" ? "bg-[#38A169]" : "bg-[rgba(245,245,245,0.2)]"}`} />
                  </div>
                </div>
                {thread.unread_admin_count > 0 && (
                  <span className="absolute right-4 bottom-4 h-5 w-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E53E3E", color: "#F5F5F5", boxShadow: "0 0 10px rgba(229,62,62,0.5)" }}>
                    {thread.unread_admin_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className={`flex-1 flex flex-col ${!selectedThread ? "hidden md:flex items-center justify-center" : "flex"}`}>
        {!selectedThread ? (
          <div className="text-center opacity-20 space-y-4">
            <MessageSquare size={48} className="mx-auto text-[#D4AF37]" />
            <p className="font-black text-[11px] uppercase tracking-[0.4em]">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(212,175,55,0.1)", background: "#0D0D0D" }}>
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedThread(null)} className="md:hidden text-[rgba(245,245,245,0.4)] mr-1"><ArrowLeft size={20} /></button>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <UserIcon size={20} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-[#F5F5F5]">{selectedThread.users.username}</h2>
                  <p className="text-[9px] font-bold text-[rgba(245,245,245,0.35)] uppercase tracking-widest">ID: {selectedThread.user_id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={toggleResolve}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                style={selectedThread.status === "open"
                  ? { background: "rgba(56,161,105,0.1)", border: "1px solid rgba(56,161,105,0.3)", color: "#38A169" }
                  : { background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }
                }>
                <CheckCircle2 size={13} />
                {selectedThread.status === "open" ? "Resolve" : "Reopen"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 luxury-scrollbar" style={{ background: "#0D0D0D" }}>
              {msgLoading ? (
                <div className="flex justify-center pt-12"><div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div>
              ) : (
                messages.map((msg, i) => {
                  const sType = msg.sender_type || (msg as any).sender || 'user';
                  const isAdmin = sType === "admin";
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[72%] px-5 py-3.5 rounded-2xl ${
                        isAdmin ? "text-[#0D0D0D] rounded-tr-none" : "text-[#F5F5F5] rounded-tl-none"
                      }`}
                        style={isAdmin
                          ? { background: "linear-gradient(135deg, #A08020, #D4AF37)" }
                          : { background: "#1A1A1A", border: "1px solid rgba(245,245,245,0.08)" }
                        }>
                        <div className={`flex items-center gap-1.5 mb-2 opacity-60 ${isAdmin ? "justify-end" : "justify-start"}`}>
                          {isAdmin ? (
                            <>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#0D0D0D]">Customer Support</span>
                              <ShieldCheck size={10} className="text-[#0D0D0D]" />
                            </>
                          ) : (
                            <>
                              <UserIcon size={10} className="text-[#D4AF37]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">{selectedThread.users.username}</span>
                            </>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold leading-relaxed">
                          {msg.message}
                        </p>
                        <p className={`text-[9px] mt-2 opacity-50 ${isAdmin ? "text-[#0D0D0D]/40 text-right" : "text-white/20 text-left"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-5" style={{ background: "#1A1A1A", borderTop: "1px solid rgba(245,245,245,0.06)" }}>
              <form onSubmit={handleSend} className="flex gap-3">
                <input type="text" placeholder="Type admin reply..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  className="input-gold flex-1 rounded-2xl py-4 px-5 text-sm" />
                <button type="submit" disabled={!newMessage.trim()}
                  className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
                  style={{ background: "linear-gradient(135deg, #A08020, #D4AF37)", boxShadow: "0 4px 16px rgba(212,175,55,0.3)" }}>
                  <Send size={18} className="text-[#0D0D0D]" />
                </button>
              </form>
              <div className="flex items-center gap-4 mt-3 opacity-30">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-[#D4AF37]" /> Official Support
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                  <Clock size={12} /> Fast Response
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
