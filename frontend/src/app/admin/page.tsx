"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Wallet, MessageSquare, CheckCircle2, XCircle,
  Search, TrendingUp, LogOut, RefreshCw, ArrowUpRight,
  ArrowDownLeft, Crown, AlertCircle, Package, Share2, Eye,
  ExternalLink, Copy, Edit2, Smartphone, Bell, Clock, Briefcase, ShieldCheck, ShieldAlert, Key, UserPlus, Trash2, Plus, Minus, Layers, ClipboardCheck, DollarSign
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";
import { supabase } from "@/lib/supabase";

const GOLDEN_GRADIENT = "linear-gradient(135deg, #A08020, #D4AF37, #F2D06B)";
const GOLDEN_COLOR = "#D4AF37";

const TAB = ({ label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
    style={active
      ? { background: GOLDEN_GRADIENT, color: "#0D0D0D", boxShadow: "0 4px 16px rgba(212,175,55,0.3)" }
      : { color: "rgba(245,245,245,0.4)" }
    }
  >
    {label}
    {badge > 0 && (
      <span className="h-4 w-4 rounded-full text-[9px] font-black flex items-center justify-center animate-pulse"
        style={{ background: "#E53E3E", color: "#F5F5F5", boxShadow: "0 0 8px rgba(229,62,62,0.6)" }}>
        {badge}
      </span>
    )}
  </button>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, logout, setUser } = useAuthStore();
  const { notifications, setNotifications } = useAdminNotifications();
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ users: [], transactions: [], products: [], levelRequests: [], vas: [] });
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [financeTab, setFinanceTab] = useState<"deposits" | "withdrawals" | "history">("deposits");

  // MODALS STATE
  const [editingUser, setEditingUser] = useState<any>(null);
  const [comboUser, setComboUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ balance: 0, isTaskLocked: false, withdrawalAddress: "" });
  const [comboForms, setComboForms] = useState([{ position: 5, itemsCount: 3, price: 100, commission: 20 }]);
  const [userCombos, setUserCombos] = useState<any[]>([]);

  const [productTab, setProductTab] = useState<number | "combos">(1);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", image: "", price: 100, commission: 20, vip_level: 1, category: "general", is_combo_item: false });

  const [showNotifTray, setShowNotifTray] = useState(false);
  const [newVA, setNewVA] = useState<any>(null);

  // --- REFINED PERMISSION LOGIC ---
  const isMasterAdmin = user?.role === 'admin' || user?.username?.toLowerCase().includes('admin');
  const isVA = user?.role === 'va';
  const vaPermissions = (user as any)?.permissions || {};

  const canEdit = isMasterAdmin || vaPermissions.can_edit;
  const canResetTasks = isMasterAdmin || vaPermissions.can_reset_tasks;
  const canApproveRequests = isMasterAdmin || vaPermissions.can_approve_requests;
  const canApproveFinance = isMasterAdmin || vaPermissions.can_approve_finance;
  const canCombo = isMasterAdmin || vaPermissions.can_combo;

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name || "",
        image: editingProduct.image || editingProduct.image_url || "",
        price: editingProduct.price || 100,
        commission: editingProduct.commission_rate || editingProduct.commission || 20,
        vip_level: editingProduct.vip_level || 1,
        category: editingProduct.category || "general",
        is_combo_item: editingProduct.is_combo_item || false
      });
      setShowAddProduct(true);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (editingUser) setEditForm({
      balance: editingUser.balance || 0,
      isTaskLocked: editingUser.isTaskLocked || false,
      withdrawalAddress: editingUser.withdrawalAddress || ""
    });
  }, [editingUser]);

  useEffect(() => {
    if (comboUser) {
      setComboForms([{ position: 5, itemsCount: 3, price: 100, commission: 20 }]);
      api.get(`/admin/users/${comboUser._id}/combos`).then(res => setUserCombos(res.data.data)).catch(console.error);
    } else {
      setUserCombos([]);
    }
  }, [comboUser]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [token, user?.role]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Determine role from store if available, otherwise we'll try to find out
      const currentRole = useAuthStore.getState().user?.role;
      const isActuallyVA = currentRole === 'va';
      const isActuallyAdmin = currentRole === 'admin' || useAuthStore.getState().user?.username?.toLowerCase().includes('admin');

      const endpoints = [
        api.get("/admin/users"),
        api.get("/admin/transactions"),
        api.get("/admin/products"),
        api.get("/admin/level-requests"),
        api.get("/admin/va"),
        api.get("/admin/chats"),
      ];

      // Always try to sync profile to ensure session integrity
      if (isActuallyVA) {
        endpoints.push(api.get("/va-auth/me"));
      } else {
        endpoints.push(api.get("/user/profile"));
      }

      const results = await Promise.allSettled(endpoints);

      // Map results
      const [usersRes, txRes, productsRes, levelRes, vasRes, chatsRes, profileRes] = results;

      setData({
        users: usersRes.status === 'fulfilled' ? usersRes.value.data.data : [],
        transactions: txRes.status === 'fulfilled' ? txRes.value.data.data : [],
        products: productsRes.status === 'fulfilled' ? productsRes.value.data.data : [],
        levelRequests: levelRes.status === 'fulfilled' ? levelRes.value.data.data : [],
        vas: vasRes.status === 'fulfilled' ? vasRes.value.data.data : [],
        chats: chatsRes.status === 'fulfilled' ? chatsRes.value.data.data : [],
      });

      if (profileRes && profileRes.status === 'fulfilled') {
        const userData = profileRes.value.data.data;
        setUser(userData);
      }
    } catch (err: any) {
      console.error("Fetch All Error:", err);
    } finally { setLoading(false); }
  };

  const handleLevelRequest = async (userId: string, level: number, action: 'approved' | 'rejected') => {
    if (!canApproveRequests) { toast.error("Unauthorized: Request Permission Required"); return; }
    setProcessingId(userId);
    try {
      const res = await api.put(`/admin/level-requests/${userId}`, { level, action });
      if (res.data.success) {
        toast.success(`Level ${level} ${action}`);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setProcessingId(null); }
  };

  const handleTransaction = async (id: string, action: "approve" | "reject") => {
    if (!canApproveFinance) { toast.error("Unauthorized: Finance Permission Required"); return; }
    setProcessingId(id);
    try {
      const res = await api.put(`/admin/transactions/${id}`, { status: action === "approve" ? "approved" : "rejected" });
      if (res.data.success) {
        toast.success(`Transaction ${action}d successfully`);
        fetchAll();
      } else {
        toast.error(res.data.message || "Approval failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to communicate with server");
    }
    finally { setProcessingId(null); }
  };

  const updateVIP = async (userId: string, vipLevel: number) => {
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    try {
      await api.put(`/admin/users/${userId}`, { vipLevel });
      toast.success(`VIP ${vipLevel} Activated`);
      fetchAll();
    } catch { toast.error("Failed to update VIP"); }
  };

  const resetUserTasks = async (userId: string) => {
    if (!canResetTasks) { toast.error("Unauthorized: Task Permission Required"); return; }
    try {
      await api.post(`/admin/users/${userId}/refresh`);
      toast.success("Tasks reset successfully");
      fetchAll();
    } catch { toast.error("Failed to reset tasks"); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    try {
      await api.put(`/admin/users/${editingUser._id}`, editForm);
      toast.success("User updated");
      setEditingUser(null);
      fetchAll();
    } catch { toast.error("Failed to update user"); }
  };

  const handleComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCombo) { toast.error("Unauthorized: Combo Permission Required"); return; }
    try {
      await api.post(`/admin/users/${comboUser._id}/combo`, { combos: comboForms });
      toast.success(`${comboForms.length} Combo(s) scheduled`);
      setComboUser(null);
      fetchAll();
    } catch { toast.error("Failed to schedule combos"); }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!canCombo) { toast.error("Unauthorized: Combo Permission Required"); return; }
    try {
      await api.delete(`/admin/users/${comboUser._id}/combos/${comboId}`);
      toast.success("Combo deleted");
      const res = await api.get(`/admin/users/${comboUser._id}/combos`);
      setUserCombos(res.data.data);
    } catch { toast.error("Failed to delete combo"); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, { ...productForm, image_url: productForm.image });
        toast.success("Product updated successfully");
      } else {
        await api.post("/admin/products", { ...productForm, image_url: productForm.image });
        toast.success("Product added successfully");
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      setProductForm({ name: "", image: "", price: 100, commission: 20, vip_level: 1, category: "general", is_combo_item: false });
      fetchAll();
    } catch { toast.error("Failed to save product"); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deleted");
      fetchAll();
    } catch { toast.error("Failed to delete product"); }
  };

  const handleCreateVA = async () => {
    if (!isMasterAdmin) return;
    try {
      const { data } = await api.post("/admin/va");
      setNewVA(data.data);
      fetchAll();
      toast.success("VA Account Generated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create VA");
    }
  };

  const handleVADelete = async (vaId: string) => {
    if (!window.confirm("Permanently delete this VA account?")) return;
    try {
      await api.delete(`/admin/va/${vaId}`);
      toast.success("VA Account Deleted");
      fetchAll();
    } catch { toast.error("Failed to delete VA"); }
  };

  const handleVAStatus = async (vaId: string, action: 'approve' | 'reject') => {
    if (!isMasterAdmin) return;
    if (action === 'reject') {
      handleVADelete(vaId);
      return;
    }
    try {
      await api.put(`/admin/va/${vaId}/status`, { action });
      toast.success(`VA ${action}d`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve VA");
    }
  };

  const toggleVAPermission = async (vaId: string, permission: string, value: boolean) => {
    if (!isMasterAdmin) return;
    try {
      await api.put(`/admin/va/${vaId}/permissions`, { [permission]: value });
      toast.success("Permission updated");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update permission");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Track last seen timestamps to clear badges
  const [lastSeenUsers, setLastSeenUsers] = useState<number>(0);
  const [lastSeenSupport, setLastSeenSupport] = useState<number>(0);

  useEffect(() => {
    const savedUsers = localStorage.getItem('lastSeenUsers');
    const savedSupport = localStorage.getItem('lastSeenSupport');
    if (savedUsers) setLastSeenUsers(parseInt(savedUsers));
    if (savedSupport) setLastSeenSupport(parseInt(savedSupport));
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      const now = Date.now();
      setLastSeenUsers(now);
      localStorage.setItem('lastSeenUsers', now.toString());
    }
    if (activeTab === 'support') {
      const now = Date.now();
      setLastSeenSupport(now);
      localStorage.setItem('lastSeenSupport', now.toString());
    }
  }, [activeTab]);

  const filteredUsers = data.users.filter((u: any) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProducts = data.products.filter((p: any) =>
    productTab === "combos" ? p.is_combo_item : p.vip_level === productTab && !p.is_combo_item
  );

  const pendingDeposits = data.transactions.filter((t: any) => t.status === "pending" && t.type === "deposit");
  const pendingWithdrawals = data.transactions.filter((t: any) => t.status === "pending" && t.type === "withdrawal");
  const txHistory = data.transactions.filter((t: any) => t.status !== "pending");

  const financeCount = pendingDeposits.length + pendingWithdrawals.length;
  const requestsCount = data.levelRequests.length;

  // Calculate Support Unread Count (Only threads with new activity since last seen)
  const supportCount = (data.chats || []).reduce((acc: number, thread: any) => {
    const lastActivity = new Date(thread.last_message_at).getTime();
    if (thread.unread_admin_count > 0 && lastActivity > lastSeenSupport) {
      return acc + thread.unread_admin_count;
    }
    return acc;
  }, 0);

  // Calculate New Users Count (Only users registered since last seen)
  const newUsersCount = data.users.filter((u: any) => {
    const registrationDate = new Date(u.createdAt).getTime();
    return registrationDate > lastSeenUsers;
  }).length;

  return (
    <div className="min-h-screen luxury-bg font-sans relative overflow-hidden pb-10">
      <div className="luxury-bg-orb w-[600px] h-[600px] -top-60 -right-40 opacity-15" />

      <header className="px-6 pt-12 pb-4 flex items-center justify-between relative z-50 bg-[#0D0D0D]/80 backdrop-blur-md">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[rgba(245,245,245,0.4)] mb-1">Control Center</p>
          <h1 className="text-xl font-black text-[#F5F5F5] tracking-tight">{isVA ? 'VA' : 'Master Admin'} <span className="text-gold-gradient">Panel</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} disabled={loading} className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all text-white/60">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={logout} className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] hover:bg-[#E53E3E]/20 transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-6 space-y-6 relative z-10 pt-6">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-white/5 p-5 rounded-[24px] relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 text-[#D4AF37]/20 group-hover:text-[#D4AF37]/40 transition-colors">
              <Users size={32} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-xl font-black text-white">{data.users.length}</h3>
            <div className="w-8 h-1 bg-gold-gradient rounded-full mt-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-white/5 p-5 rounded-[24px] relative overflow-hidden group hover:border-[#E53E3E]/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 text-[#E53E3E]/10 group-hover:text-[#E53E3E]/30 transition-colors">
              <AlertCircle size={32} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Pending Requests</p>
            <h3 className="text-xl font-black text-white">{financeCount + requestsCount}</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-[#E53E3E] to-[#C53030] rounded-full mt-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-white/5 p-5 rounded-[24px] relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 text-[#D4AF37]/20 group-hover:text-[#D4AF37]/40 transition-colors">
              <ShieldCheck size={32} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">VA Created</p>
            <h3 className="text-xl font-black text-white">{data.vas.length}</h3>
            <div className="w-8 h-1 bg-gold-gradient rounded-full mt-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-white/5 p-5 rounded-[24px] relative overflow-hidden group hover:border-[#48BB78]/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 text-[#48BB78]/10 group-hover:text-[#48BB78]/30 transition-colors">
              <ArrowUpRight size={32} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Deposits</p>
            <h3 className="text-xl font-black text-white">
              ${data.transactions
                .filter((t: any) => t.type === 'deposit' && t.status === 'approved')
                .reduce((sum: number, t: any) => sum + Number(t.net_amount || t.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="w-8 h-1 bg-gradient-to-r from-[#48BB78] to-[#2F855A] rounded-full mt-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-white/5 p-5 rounded-[24px] relative overflow-hidden group hover:border-[#E53E3E]/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 text-[#E53E3E]/10 group-hover:text-[#E53E3E]/30 transition-colors">
              <ArrowDownLeft size={32} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Withdrawals</p>
            <h3 className="text-xl font-black text-white">
              ${data.transactions
                .filter((t: any) => t.type === 'withdrawal' && t.status === 'approved')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="w-8 h-1 bg-gradient-to-r from-[#E53E3E] to-[#C53030] rounded-full mt-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-[#D4AF37]/20 p-5 rounded-[24px] relative overflow-hidden group hover:bg-[#D4AF37]/5 transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 text-[#D4AF37]/30 group-hover:scale-110 transition-transform">
              <DollarSign size={32} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Total Earnings</p>
            <h3 className="text-xl font-black text-white">
              ${data.transactions
                .filter((t: any) => t.type === 'withdrawal' && t.status === 'approved')
                .reduce((sum: number, t: any) => sum + (Number(t.amount) * 0.05), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[7px] text-white/30 mt-1">5% fee on withdrawals</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap bg-[#1A1A1A] border border-white/5 rounded-2xl p-2">
          <TAB label="Users" active={activeTab === "users"} onClick={() => setActiveTab("users")} badge={newUsersCount} />
          {canApproveFinance && <TAB label="Finance" active={activeTab === "finance"} onClick={() => setActiveTab("finance")} badge={financeCount} />}
          {canApproveRequests && <TAB label="Requests" active={activeTab === "level-requests"} onClick={() => setActiveTab("level-requests")} badge={requestsCount} />}
          <TAB label="Support" active={activeTab === "support"} onClick={() => { setActiveTab("support"); router.push("/admin/support"); }} badge={supportCount} />
          {isMasterAdmin && <TAB label="Products" active={activeTab === "products"} onClick={() => setActiveTab("products")} />}
          {isMasterAdmin && <TAB label="VAs" active={activeTab === "vas"} onClick={() => setActiveTab("vas")} />}
        </div>

        {activeTab === "users" && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-gold w-full rounded-2xl py-4 pl-12 pr-5 text-sm" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {filteredUsers.map((u: any) => (
                  <div key={u._id} className="rounded-[20px] p-5 bg-[#1A1A1A] border border-white/5 transition-all hover:border-[#D4AF37]/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm bg-[#D4AF37]/10 text-[#D4AF37]">{u.username?.[0]?.toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-black text-white">{u.username}</p>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">User Profile Details</p>
                          {u.activeCombos && (
                            <p className="text-[8px] font-black text-[#38A169] uppercase mt-1">Combos: {u.activeCombos}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gold-gradient">${(u.balance ?? 0).toFixed(2)}</p>
                        <p className="text-[9px] font-black text-[#D4AF37] uppercase">Current: V{u.vipLevel || 1}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3].map(lvl => (
                        <button key={lvl} onClick={() => updateVIP(u._id, lvl)}
                          disabled={!canEdit}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${!canEdit ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-95'}`}
                          style={u.vipLevel === lvl
                            ? { background: GOLDEN_GRADIENT, color: "#0D0D0D", transform: canEdit ? "scale(1.05)" : "scale(1)", border: "none" }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.05)" }
                          }>
                          VIP {lvl}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button onClick={() => setEditingUser(u)} disabled={!canEdit}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase bg-[#252525] transition-all ${canEdit ? 'text-white/60 hover:text-white' : 'text-white/10 cursor-not-allowed'}`}>
                        Edit
                      </button>
                      <button onClick={() => resetUserTasks(u._id)} disabled={!canResetTasks}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase bg-[#252525] transition-all ${canResetTasks ? 'text-white/60 hover:text-[#D4AF37]' : 'text-white/10 cursor-not-allowed'}`}>
                        Reset
                      </button>
                      <button onClick={() => setComboUser(u)} disabled={!canCombo}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase bg-[#252525] transition-all ${canCombo ? 'text-white/60 hover:text-[#38A169]' : 'text-white/10 cursor-not-allowed'}`}>
                        Combo
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "finance" && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                  {["deposits", "withdrawals", "history"].map(t => (
                    <button key={t} onClick={() => setFinanceTab(t as any)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${financeTab === t ? "bg-white/10 text-white shadow-md border border-white/10" : "text-white/40 hover:text-white/70"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {(() => {
                  const txs = financeTab === "deposits" ? pendingDeposits : financeTab === "withdrawals" ? pendingWithdrawals : txHistory;
                  return txs.map((tx: any) => (
                    <div key={tx.id} className="rounded-[20px] p-5 bg-[#1A1A1A] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-[#38A169]/10 text-[#38A169]' : 'bg-[#E53E3E]/10 text-[#E53E3E]'}`}><ArrowUpRight size={18} /></div>
                          <div><p className="text-sm font-black text-white uppercase">{tx.type}</p><p className="text-[9px] font-bold text-white/20 uppercase">{tx.users?.username}</p></div>
                        </div>
                        <p className="text-lg font-black text-gold-gradient">${parseFloat(tx.amount).toFixed(2)}</p>
                      </div>
                      {tx.status === 'pending' && (
                        <div className="flex gap-3">
                          <button onClick={() => handleTransaction(tx.id, "approve")} disabled={processingId === tx.id || !canApproveFinance}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${canApproveFinance ? 'bg-[#38A169]/10 text-[#38A169] border border-[#38A169]/30 hover:bg-[#38A169]/20' : 'bg-white/5 text-white/10 border-white/5 cursor-not-allowed'}`}>
                            Approve
                          </button>
                          <button onClick={() => handleTransaction(tx.id, "reject")} disabled={processingId === tx.id || !canApproveFinance}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${canApproveFinance ? 'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/30 hover:bg-[#E53E3E]/20' : 'bg-white/5 text-white/10 border-white/5 cursor-not-allowed'}`}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </motion.div>
            )}

            {activeTab === "products" && isMasterAdmin && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Product Library</p>
                  <button onClick={() => { setEditingProduct(null); setShowAddProduct(true); }}
                    style={{ background: GOLDEN_GRADIENT, color: "#0D0D0D", boxShadow: "0 0 30px rgba(212,175,55,0.4)" }}
                    className="h-12 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <Plus size={18} /> Add New Product
                  </button>
                </div>
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                  {[1, 2, 3, "combos"].map(lvl => (
                    <button key={lvl} onClick={() => setProductTab(lvl as any)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${productTab === lvl ? "bg-white/10 text-white shadow-md border border-white/10" : "text-white/40 hover:text-white/70"}`}>
                      {lvl === "combos" ? "Combos" : `VIP ${lvl}`}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredProducts.map((product: any) => (
                    <div key={product.id} className="h-[240px] rounded-[24px] overflow-hidden bg-[#1A1A1A] border border-white/5 flex flex-col group transition-all hover:border-[#D4AF37]/30">
                      <div className="h-[150px] relative bg-black/40 p-4 flex items-center justify-center overflow-hidden">
                        <img src={product.image_url || product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                          <button onClick={() => setEditingProduct(product)} className="p-2 rounded-xl bg-[#D4AF37] text-black shadow-lg hover:scale-110 transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 rounded-xl bg-[#E53E3E] text-white shadow-lg hover:scale-110 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/20">
                        <div><p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{product.name}</p><p className="text-[7px] font-bold text-white/20 uppercase tracking-[0.1em] mt-0.5">{product.is_combo_item ? 'Combo' : `Tier V${product.vip_level}`}</p></div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5"><p className="text-[11px] font-black text-[#F5F5F5]">${product.price}</p><p className="text-[8px] font-black text-[#38A169]">+{product.commission_rate || product.commission}%</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "vas" && isMasterAdmin && (
              <motion.div key="vas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">VA Fleet Control</p>
                  <button onClick={handleCreateVA}
                    style={{ background: GOLDEN_GRADIENT, color: "#0D0D0D", boxShadow: "0 0 30px rgba(212,175,55,0.4)" }}
                    className="h-12 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                    <UserPlus size={18} /> Create VA Account
                  </button>
                </div>
                <div className="space-y-3">
                  {data.vas.map((va: any) => {
                    const perms = Array.isArray(va.va_permissions) ? (va.va_permissions[0] || {}) : (va.va_permissions || {});
                    return (
                      <div key={va.id} className="p-6 rounded-[32px] bg-[#1A1A1A] border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20"><Briefcase size={24} /></div>
                            <div><p className="text-sm font-black text-white">{va.username}</p><p className={`text-[9px] font-black uppercase mt-0.5 ${va.status === 'approved' ? 'text-[#38A169]' : 'text-[#D4AF37]'}`}>{va.status}</p></div>
                          </div>
                          <div className="flex gap-2">
                            {va.status === 'pending' ? (
                              <><button onClick={() => handleVAStatus(va.id, 'approve')} className="p-3 bg-[#38A169]/10 text-[#38A169] rounded-xl"><CheckCircle2 size={18} /></button><button onClick={() => handleVAStatus(va.id, 'reject')} className="p-3 bg-[#E53E3E]/10 text-[#E53E3E] rounded-xl"><XCircle size={18} /></button></>
                            ) : (
                              <button onClick={() => handleVADelete(va.id)} className="px-4 py-2 rounded-xl bg-[#E53E3E]/10 text-[9px] font-black uppercase text-[#E53E3E] border border-[#E53E3E]/20 hover:bg-[#E53E3E]/20">Delete Account</button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {['can_edit', 'can_reset_tasks', 'can_combo', 'can_approve_requests', 'can_approve_finance'].map(p => {
                            const active = !!perms[p];
                            return (
                              <button key={p} onClick={() => toggleVAPermission(va.id, p, !active)}
                                className={`group relative p-4 rounded-2xl border transition-all flex items-center justify-between overflow-hidden ${active
                                    ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                    : 'border-white/5 bg-black/20 opacity-60'
                                  }`}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-gold-gradient text-black' : 'bg-white/5 text-white/20'}`}>
                                    {p === 'can_combo' ? <Layers size={14} /> :
                                      p === 'can_edit' ? <Edit2 size={14} /> :
                                        p === 'can_approve_finance' ? <Wallet size={14} /> :
                                          p === 'can_approve_requests' ? <Crown size={14} /> :
                                            <ClipboardCheck size={14} />}
                                  </div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>
                                    {p.replace('can_', '').replace('_', ' ')}
                                  </span>
                                </div>

                                <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-[#38A169]' : 'bg-white/10'}`}>
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
                                </div>

                                {active && (
                                  <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "level-requests" && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {data.levelRequests.map((req: any) => (
                  <div key={req._id} className="p-6 rounded-[32px] bg-[#1A1A1A] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><Crown size={24} /></div>
                      <div><p className="text-sm font-black text-white">{req.username}</p><p className="text-[9px] font-bold text-white/20 uppercase">Requesting VIP {req.vipLevelRequest}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLevelRequest(req._id, req.vipLevelRequest, 'approved')} disabled={!canApproveRequests || processingId === req._id}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${canApproveRequests ? 'bg-[#38A169] text-white hover:bg-[#2F855A]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
                        Approve
                      </button>
                      <button onClick={() => handleLevelRequest(req._id, req.vipLevelRequest, 'rejected')} disabled={!canApproveRequests || processingId === req._id}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${canApproveRequests ? 'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/20 hover:bg-[#E53E3E]/20' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {data.levelRequests.length === 0 && <div className="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">No pending requests</div>}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {newVA && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-[40px] p-8 bg-[#141414] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.2)] text-center">
              <div className="h-20 w-20 rounded-3xl bg-gold-gradient mx-auto mb-6 flex items-center justify-center shadow-xl shadow-[#D4AF37]/20">
                <ShieldCheck size={40} className="text-[#0D0D0D]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">VA Account Created</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-8">Generated Credentials</p>
              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
                  <div className="text-left"><p className="text-[8px] font-black text-white/20 uppercase mb-1">Username</p><p className="text-sm font-black text-white">{newVA.username}</p></div>
                  <button onClick={() => copyToClipboard(newVA.username)} className="p-2 text-white/20 hover:text-[#D4AF37] transition-all"><Copy size={16} /></button>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
                  <div className="text-left"><p className="text-[8px] font-black text-white/20 uppercase mb-1">Generated Password</p><p className="text-sm font-black text-[#D4AF37] tracking-wider">{newVA.password}</p></div>
                  <button onClick={() => copyToClipboard(newVA.password)} className="p-2 text-white/20 hover:text-[#D4AF37] transition-all"><Copy size={16} /></button>
                </div>
              </div>
              <p className="text-[9px] font-bold text-[#E53E3E] uppercase tracking-widest mb-8 flex items-center justify-center gap-2 animate-pulse"><AlertCircle size={12} /> Save these details now</p>
              <button onClick={() => setNewVA(null)} className="btn-gold w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">I Have Saved Them</button>
            </motion.div>
          </motion.div>
        )}

        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-[32px] p-8 bg-[#141414] border border-[#D4AF37]/20 shadow-2xl">
              <div className="flex justify-between items-center mb-8"><h3 className="text-sm font-black uppercase text-white tracking-widest">Update Profile</h3><button onClick={() => setEditingUser(null)}><XCircle size={24} className="text-white/30" /></button></div>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Balance ($)</label><input type="number" step="0.01" value={editForm.balance} onChange={e => setEditForm({ ...editForm, balance: parseFloat(e.target.value) })} className="input-gold w-full rounded-2xl py-4 px-5 bg-white/5 border-white/10 text-white font-bold" /></div>
                <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Wallet Address</label><input type="text" value={editForm.withdrawalAddress} onChange={e => setEditForm({ ...editForm, withdrawalAddress: e.target.value })} className="input-gold w-full rounded-2xl py-4 px-5 bg-white/5 border-white/10 text-white font-bold" /></div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10"><div className="flex items-center gap-3"><Key size={18} className="text-[#D4AF37]" /><span className="text-[10px] font-black uppercase text-white/80">Lock Tasks</span></div><button type="button" onClick={() => setEditForm({ ...editForm, isTaskLocked: !editForm.isTaskLocked })} className={`w-12 h-6 rounded-full transition-all relative ${editForm.isTaskLocked ? 'bg-[#E53E3E]' : 'bg-white/10'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editForm.isTaskLocked ? 'left-7' : 'left-1'}`} /></button></div>
                <button type="submit" style={{ background: GOLDEN_GRADIENT, color: "#0D0D0D" }} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#D4AF37]/30">Save Changes</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {comboUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-[32px] p-8 bg-[#141414] border border-[#38A169]/20 max-h-[90vh] overflow-y-auto luxury-scrollbar shadow-2xl">
              <div className="flex justify-between items-center mb-8"><div><h3 className="text-sm font-black uppercase text-white">Combo Scheduler</h3><p className="text-[10px] font-bold text-white/40 mt-1">{comboUser.username}</p></div><button onClick={() => setComboUser(null)}><XCircle className="text-white/30" size={24} /></button></div>
              {userCombos.length > 0 && <div className="mb-8 space-y-3"><p className="text-[9px] font-black uppercase text-[#38A169]">Active Schedules</p>{userCombos.map((c, idx) => (<div key={idx} className="p-4 rounded-2xl bg-[#38A169]/5 border border-[#38A169]/20 flex items-center justify-between"><div><p className="text-xs font-black text-white">Pos: {c.position} | {c.items_count || c.itemsCount} Items</p><p className="text-[9px] font-bold text-white/40 uppercase">${c.price} | {c.commission}%</p></div><button onClick={() => handleDeleteCombo(c.id)} className="p-2 text-[#E53E3E]"><Trash2 size={16} /></button></div>))}</div>}
              <form onSubmit={handleComboSubmit} className="space-y-6">
                {comboForms.map((form, index) => (
                  <div key={index} className="p-6 rounded-[24px] bg-white/5 border border-white/10 space-y-5">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-[#D4AF37]">Set {index + 1}</span>{comboForms.length > 1 && <button type="button" onClick={() => setComboForms(comboForms.filter((_, i) => i !== index))} className="text-[#E53E3E] text-[9px] font-black uppercase">Remove</button>}</div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-[8px] font-black uppercase text-white/30 block mb-2">Position</label><input type="number" value={form.position} onChange={e => { const n = [...comboForms]; n[index].position = parseInt(e.target.value); setComboForms(n); }} className="input-gold w-full rounded-xl py-3 px-4 text-xs font-bold text-white" /></div><div><label className="text-[8px] font-black uppercase text-white/30 block mb-2">Items</label><input type="number" value={form.itemsCount} onChange={e => { const n = [...comboForms]; n[index].itemsCount = parseInt(e.target.value); setComboForms(n); }} className="input-gold w-full rounded-xl py-3 px-4 text-xs font-bold text-white" /></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-[8px] font-black uppercase text-white/30 block mb-2">Price ($)</label><input type="number" value={form.price} onChange={e => { const n = [...comboForms]; n[index].price = parseFloat(e.target.value); setComboForms(n); }} className="input-gold w-full rounded-xl py-3 px-4 text-xs font-bold text-white" /></div><div><label className="text-[8px] font-black uppercase text-white/30 block mb-2">Comm (%)</label><input type="number" value={form.commission} onChange={e => { const n = [...comboForms]; n[index].commission = parseFloat(e.target.value); setComboForms(n); }} className="input-gold w-full rounded-xl py-3 px-4 text-xs font-bold text-white" /></div></div>
                  </div>
                ))}
                <button type="button" onClick={() => setComboForms([...comboForms, { position: 5, itemsCount: 3, price: 100, commission: 20 }])} className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-white/40 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-[#D4AF37]/30 hover:text-white transition-all"><Plus size={14} /> Add Another</button>
                <button type="submit" className="w-full py-4 rounded-2xl bg-[#38A169] text-white font-black uppercase shadow-xl shadow-[#38A169]/30">Confirm All Schedules</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-sm rounded-[32px] p-8 bg-[#141414] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.2)] max-h-[90vh] overflow-y-auto luxury-scrollbar">
              <div className="flex justify-between items-center mb-8"><h3 className="text-sm font-black uppercase text-white tracking-widest">Store Inventory</h3><button onClick={() => setShowAddProduct(false)}><XCircle className="text-white/30" size={24} /></button></div>
              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Name</label><input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="input-gold w-full rounded-2xl py-4 px-5 bg-white/5 border-white/10 text-white font-bold" /></div>
                <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Image URL</label><input type="text" required value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} className="input-gold w-full rounded-2xl py-4 px-5 bg-white/5 border-white/10 text-white font-mono text-xs" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Price ($)</label><input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} className="input-gold w-full rounded-2xl py-4 px-5 bg-white/5 border-white/10 text-white font-bold" /></div>
                  <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Comm (%)</label><input type="number" required value={productForm.commission} onChange={e => setProductForm({ ...productForm, commission: parseFloat(e.target.value) })} className="input-gold w-full rounded-2xl py-4 px-5 bg-white/5 border-white/10 text-white font-bold" /></div>
                </div>
                <div><label className="text-[9px] font-black uppercase text-white/40 block mb-2 px-1">Assignment</label><div className="grid grid-cols-2 gap-2">{[1, 2, 3].map(lvl => (<button key={lvl} type="button" onClick={() => setProductForm({ ...productForm, vip_level: lvl, is_combo_item: false })} style={productForm.vip_level === lvl && !productForm.is_combo_item ? { background: GOLDEN_GRADIENT, color: "#0D0D0D", border: "none" } : {}} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${productForm.vip_level === lvl && !productForm.is_combo_item ? '' : 'bg-white/5 text-white/30 border-white/10'}`}>V{lvl}</button>))} <button type="button" onClick={() => setProductForm({ ...productForm, is_combo_item: true })} style={productForm.is_combo_item ? { background: "#38A169", color: "white", border: "none" } : {}} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${productForm.is_combo_item ? '' : 'bg-white/5 text-white/30 border-white/10'}`}>Combo</button></div></div>
                <button type="submit" style={{ background: GOLDEN_GRADIENT, color: "#0D0D0D" }} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-[#D4AF37]/40 mt-4">Add Product</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}