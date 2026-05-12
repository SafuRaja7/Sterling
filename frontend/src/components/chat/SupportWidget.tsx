"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, User as UserIcon, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Message {
  id: string;
  message: string;
  sender_type: "user" | "admin" | "system";
  created_at: string;
}

export default function SupportWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide widget on profile page, admin pages, login, register, and splash screen
  const isHidden = pathname === "/profile" || pathname.startsWith("/admin") || pathname === "/login" || pathname === "/register" || pathname === "/";

  useEffect(() => {
    if (!token || !user || isHidden) return;

    if (isOpen) {
      fetchThread();
    }

    if (!socketRef.current) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
      socketRef.current = io(socketUrl);
      socketRef.current.on("connect", () => {
        socketRef.current?.emit("join_user_room", user._id);
      });
      socketRef.current.on("receive_support_message", (data: any) => {
        setMessages((prev) => [...prev, data]);
        if (!isOpen) {
          toast("New support message", { icon: "💬" });
        }
      });
    }

    return () => {
      // Don't disconnect on unmount, we want to keep listening for notifications
      // socketRef.current?.disconnect();
    };
  }, [token, user, isHidden, isOpen]);

  useEffect(() => {
    if (searchParams.get("chat") === "true") {
      setIsOpen(true);
      // Optional: remove the query param so it doesn't re-open on refresh
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/chat/thread");
      if (data.success && data.data) {
        setMessages(data.data.messages || []);
      }
    } catch (err: any) {
      console.error("Failed to load chat", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    const msgText = newMessage.trim();
    setNewMessage("");

    // Optimistic UI update
    const tempMsg: Message = {
      id: Date.now().toString(),
      message: msgText,
      sender_type: "user",
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await api.post("/chat/message", { message: msgText });
      if (data.success) {
        // Replace temp message with real message
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.data : m));
      }
    } catch (err) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  if (isHidden) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(212,175,55,0.4)] transition-transform hover:scale-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #A08020, #D4AF37, #F0D060)" }}
          >
            <MessageSquare size={24} className="text-[#0D0D0D]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-[360px] h-[500px] max-h-[70vh] rounded-[24px] flex flex-col overflow-hidden shadow-2xl"
            style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.3)" }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[rgba(212,175,55,0.1)] relative">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <ShieldCheck size={20} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#F5F5F5]">Live Support</h3>
                  <p className="text-[9px] font-bold text-[#38A169] uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38A169] animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 luxury-scrollbar" style={{ background: "#0D0D0D" }}>
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <MessageSquare size={32} className="text-[#D4AF37] mb-3 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">How can we help you today?</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const sType = msg.sender_type || (msg as any).sender || 'user';
                  const isUser = sType === "user";
                  return (
                    <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[85%] rounded-[20px] px-4 py-3 ${
                        isUser 
                          ? "bg-[#D4AF37] text-[#0D0D0D] rounded-tr-sm" 
                          : "bg-[#252525] border border-white/5 rounded-tl-sm text-white"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                          {isUser ? (
                            <>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#0D0D0D]">You</span>
                              <UserIcon size={10} className="text-[#0D0D0D]" />
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={10} className="text-[#D4AF37]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">Support Team</span>
                            </>
                          )}
                        </div>
                        <p className={`text-[11px] font-bold leading-relaxed`}>
                          {msg.message}
                        </p>
                        <p className={`text-[8px] font-bold mt-2 uppercase tracking-widest ${isUser ? "text-[#0D0D0D]/40" : "text-white/20"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-[#1A1A1A] border-t border-[rgba(212,175,55,0.1)]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-[#252525] text-white text-xs font-medium rounded-full py-3 pl-4 pr-12 focus:outline-none border border-white/5 focus:border-[#D4AF37]/30 transition-colors placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1.5 h-8 w-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                  style={{ background: newMessage.trim() ? "linear-gradient(135deg, #A08020, #D4AF37)" : "transparent", color: newMessage.trim() ? "#0D0D0D" : "rgba(245,245,245,0.3)" }}
                >
                  <Send size={14} className={newMessage.trim() ? "ml-0.5" : ""} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
