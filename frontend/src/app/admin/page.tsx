"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Wallet, MessageSquare, CheckCircle2, XCircle,
  Search, LogOut, RefreshCw, ArrowUpRight,
  ArrowDownLeft, Crown, AlertCircle, Package, Share2, Eye,
  ExternalLink, Copy, Edit2, Smartphone, Bell, Clock, Briefcase, ShieldCheck, ShieldAlert, Key, UserPlus, Trash2, Plus, Minus, Layers, ClipboardCheck, DollarSign, Sparkles
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
  const [editForm, setEditForm] = useState({ balance: 0, isTaskLocked: false, withdrawalAddress: "", vipLevel: 0, username: "", password: "" });
  const [comboForms, setComboForms] = useState([{ position: 5, itemsCount: 3, price: 100, commission: 20 }]);
  const [userCombos, setUserCombos] = useState<any[]>([]);

  const [productTab, setProductTab] = useState<number | "combos">(1);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", image: "", price: 100, commission: 20, vip_level: 1, category: "general", is_combo_item: false });

  const [showNotifTray, setShowNotifTray] = useState(false);
  const [newVA, setNewVA] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [viewingReferrals, setViewingReferrals] = useState<any>(null);

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
      isTaskLocked: editingUser.is_task_locked || editingUser.isTaskLocked || false,
      withdrawalAddress: editingUser.withdrawal_address || editingUser.withdrawalAddress || "",
      vipLevel: editingUser.vip_level || editingUser.vipLevel || 0,
      username: editingUser.username || "",
      password: "" // Keep empty for security, only update if filled
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
    } catch { toast.error("Failed to update VIP"); }
  };

  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const loadingToast = toast.loading("Updating password...");
    try {
      const res = await api.post("/admin/change-password", {
        currentPassword: adminPasswordForm.currentPassword,
        newPassword: adminPasswordForm.newPassword
      });

      // Update the stored token with the fresh one returned by the server.
      // Supabase invalidates the old token on password change, so we MUST
      // store the new token to avoid 401 errors on the next page refresh.
      if (res.data.newToken) {
        useAuthStore.getState().login(user!, res.data.newToken);
      }

      toast.success("Password changed successfully!", { id: loadingToast });
      setAdminPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      // Redirect to main dashboard tab after password change
      setActiveTab("users");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password", { id: loadingToast });
    }
  };

  const resetUserTasks = async (userId: string) => {
    if (!canResetTasks) { toast.error("Unauthorized: Task Permission Required"); return; }
    try {
      await api.post(`/admin/users/${userId}/refresh`);
      toast.success("Tasks reset successfully");
      fetchAll();
    } catch { toast.error("Failed to reset tasks"); }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/admin/users/${userToDelete._id}`);
      setSuccessMessage("User deleted completely from system");
      setUserToDelete(null);
      fetchAll();
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to delete user");
    }
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
      setSuccessMessage(`${comboForms.length} Combo(s) scheduled successfully`);
      setComboUser(null);
      fetchAll();
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to schedule combos");
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!canCombo) { toast.error("Unauthorized: Combo Permission Required"); return; }
    try {
      await api.delete(`/admin/combo/${comboId}`);
      setSuccessMessage("Combo deleted successfully");
      const res = await api.get(`/admin/users/${comboUser._id}/combos`);
      setUserCombos(res.data.data);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to delete combo");
    }
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
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center relative overflow-hidden">
            <img 
              src="/images/icons/shopify.png" 
              alt="Logo" 
              className="w-full h-[140%] object-contain object-top drop-shadow-[0_4px_8px_rgba(212,175,55,0.4)]" 
              style={{ mixBlendMode: "screen" }}
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[rgba(245,245,245,0.4)] mb-0.5">Control Center</p>
            <h1 className="text-xl font-black text-[#F5F5F5] tracking-tight">{isVA ? 'VA' : 'Master Admin'} <span className="text-gold-gradient">Panel</span></h1>
          </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
          {[
            { label: "Total Users", val: data.users.length, icon: Users, color: "#D4AF37" },
            { label: "Pending Tasks", val: financeCount + requestsCount, icon: Clock, color: "#E53E3E" },
            { label: "Active VAs", val: data.vas.length, icon: ShieldCheck, color: "#D4AF37" },
            { 
              label: "Net Deposits", 
              val: `$${data.transactions.filter((t: any) => t.type === 'deposit' && t.status === 'approved').reduce((sum: number, t: any) => sum + Number(t.net_amount || t.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              icon: ArrowUpRight, 
              color: "#48BB78" 
            },
            { 
              label: "Withdrawals", 
              val: `$${data.transactions.filter((t: any) => t.type === 'withdrawal' && t.status === 'approved').reduce((sum: number, t: any) => sum + Number(t.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              icon: ArrowDownLeft, 
              color: "#E53E3E" 
            },
            { 
              label: "Admin Earnings", 
              val: `$${data.transactions.filter((t: any) => t.type === 'withdrawal' && t.status === 'approved').reduce((sum: number, t: any) => sum + (Number(t.amount) * 0.05), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              icon: DollarSign, 
              color: "#D4AF37",
              sub: "5% platform fee"
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-[#0F0F0F] border border-white/5 p-6 rounded-[32px] overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                <stat.icon size={48} strokeWidth={1} style={{ color: stat.color }} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: stat.color }} />
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">{stat.label}</p>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mb-1">{stat.val}</h3>
                {stat.sub && <p className="text-[7px] font-bold text-white/10 uppercase tracking-widest">{stat.sub}</p>}
                
                <div className="w-6 h-0.5 mt-4 rounded-full transition-all duration-500 group-hover:w-12" style={{ background: `linear-gradient(90deg, ${stat.color}44, transparent)` }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sliding Tab Switcher */}
        <div className="p-1.5 bg-[#0F0F0F] border border-white/5 rounded-[24px] flex flex-wrap gap-1 relative mb-8">
          {[
            { id: "users", label: "Users", icon: Users, badge: newUsersCount },
            { id: "finance", label: "Finance", icon: Wallet, badge: financeCount, show: canApproveFinance },
            { id: "level-requests", label: "Requests", icon: Crown, badge: requestsCount, show: canApproveRequests },
            { id: "support", label: "Support", icon: MessageSquare, badge: supportCount },
            { id: "products", label: "Inventory", icon: Package, show: isMasterAdmin },
            { id: "vas", label: "Team", icon: Briefcase, show: isMasterAdmin },
            { id: "security", label: "Access", icon: Key, show: isMasterAdmin },
          ].filter(t => t.show !== false).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "support") { router.push("/admin/support"); return; }
                setActiveTab(tab.id);
              }}
              className={`relative px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 flex items-center gap-2 group ${activeTab === tab.id ? "text-black" : "text-white/30 hover:text-white"}`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="adminTab"
                  className="absolute inset-0 bg-gold-gradient rounded-[18px] shadow-[0_8px_20px_rgba(212,175,55,0.3)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon size={14} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`relative z-10 ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeTab === tab.id ? "bg-black/20 text-black" : "bg-[#E53E3E] text-white animate-pulse"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="group relative mb-8">
            <div className="absolute inset-0 bg-[#D4AF37]/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search user by name or ID..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-16 rounded-[24px] bg-[#0F0F0F] border border-white/5 pl-16 pr-6 text-sm font-bold text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37]/30 transition-all shadow-2xl" 
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {filteredUsers.map((u: any) => (
                  <div key={u._id} className="group relative rounded-[40px] p-8 bg-[#0A0A0A] border border-white/5 transition-all duration-700 hover:border-[#D4AF37]/40 hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden">
                    {/* Shimmering Glass Effect Layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative z-10 flex flex-col gap-8">
                      {/* Top Header: Identity & Premium Wallet */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="h-16 w-16 rounded-3xl flex items-center justify-center font-black text-2xl bg-gold-gradient text-black shadow-[0_10px_30px_rgba(212,175,55,0.3)]">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                            {u.activeCombos && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#38A169] rounded-full border-2 border-[#0A0A0A] animate-pulse shadow-[0_0_10px_rgba(56,161,105,0.5)]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1.5">
                              <h4 className="text-xl font-black text-white tracking-tight">{u.username}</h4>
                              <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/30'}`}>
                                {u.role}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                              <span>ID: {u._id.substring(0, 8)}</span>
                              {u.activeCombos && (
                                <span className="flex items-center gap-1.5 text-[#38A169]">
                                  <Layers size={10} />
                                  POS: {u.activeCombos}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Premium Wallet Display */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-6 shadow-inner">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Total Balance</p>
                            <h3 className="text-2xl font-black text-white tracking-tighter">
                              <span className="text-[#D4AF37] mr-1">$</span>
                              {(u.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                          </div>
                          <div className="h-10 w-[1px] bg-white/10" />
                          <div className="text-right">
                            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-1">Tier</p>
                            <div className="flex items-center gap-1.5 justify-end">
                              <Crown size={12} className="text-[#D4AF37]" />
                              <span className="text-sm font-black text-white">V{u.vipLevel || 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* VIP Selection: Enhanced Spacing & tactile feel */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] px-2">Access Tier Management</p>
                        <div className="grid grid-cols-3 gap-6">
                          {[1, 2, 3].map(lvl => (
                            <button key={lvl} onClick={() => updateVIP(u._id, lvl)}
                              disabled={!canEdit}
                              className={`group/btn relative py-5 rounded-[24px] text-[11px] font-black uppercase transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden ${!canEdit ? 'opacity-30 cursor-not-allowed' : 'hover:scale-[1.05] active:scale-95'}`}
                              style={u.vipLevel === lvl
                                ? { background: GOLDEN_GRADIENT, color: "#0D0D0D", boxShadow: "0 15px_30px_rgba(212,175,55,0.4)" }
                                : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.05)" }
                              }>
                              {u.vipLevel === lvl ? (
                                <Sparkles size={14} className="animate-pulse" />
                              ) : (
                                <ShieldCheck size={14} className="opacity-0 group-hover/btn:opacity-50 transition-opacity" />
                              )}
                              VIP {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tactical Action Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
                        <button onClick={() => setEditingUser(u)} disabled={!canEdit}
                          className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 transition-all group/action ${canEdit ? 'text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20' : 'text-white/5 cursor-not-allowed'}`}>
                          <Edit2 size={16} className="group-hover/action:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
                        </button>
                        
                        <button onClick={() => resetUserTasks(u._id)} disabled={!canResetTasks}
                          className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 transition-all group/action ${canResetTasks ? 'text-white/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30' : 'text-white/5 cursor-not-allowed'}`}>
                          <RefreshCw size={16} className="group-hover/action:rotate-180 transition-transform duration-700" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Reset</span>
                        </button>
                        
                        <button onClick={() => setComboUser(u)} disabled={!canCombo}
                          className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 transition-all group/action ${canCombo ? 'text-white/40 hover:text-[#38A169] hover:bg-[#38A169]/10 hover:border-[#38A169]/30' : 'text-white/5 cursor-not-allowed'}`}>
                          <Layers size={16} className="group-hover/action:translate-y-[-2px] transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Combo</span>
                        </button>
                        
                        <button onClick={() => setViewingReferrals(u)}
                          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 transition-all group/action text-white/40 hover:text-[#3182CE] hover:bg-[#3182CE]/10 hover:border-[#3182CE]/30">
                          <Users size={16} className="group-hover/action:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-center">Referral</span>
                        </button>

                        {isMasterAdmin && (
                          <button onClick={() => setUserToDelete(u)}
                            className="flex items-center justify-center rounded-2xl bg-[#E53E3E]/5 text-[#E53E3E]/40 border border-[#E53E3E]/10 hover:bg-[#E53E3E] hover:text-white hover:border-[#E53E3E] transition-all group/del">
                            <Trash2 size={20} className="group-hover/del:scale-110 group-active:scale-90 transition-transform" />
                          </button>
                        )}
                      </div>
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
                    <div key={tx.id} className={`rounded-[32px] p-6 bg-[#0D0D0D] border relative overflow-hidden group transition-all duration-500 hover:shadow-2xl ${
                      tx.type === 'deposit' ? 'border-[#38A169]/10 hover:border-[#38A169]/30' : 'border-[#E53E3E]/10 hover:border-[#E53E3E]/30'
                    }`}>
                      {/* Ambient background glow */}
                      <div className={`absolute -right-20 -top-20 w-40 h-40 blur-[60px] opacity-10 transition-all group-hover:opacity-20 ${tx.type === 'deposit' ? 'bg-[#38A169]' : 'bg-[#E53E3E]'}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 relative z-10">
                        <div className="flex items-center gap-5">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${tx.type === 'deposit' ? 'bg-[#38A169]/10 text-[#38A169] group-hover:bg-[#38A169] group-hover:text-white' : 'bg-[#E53E3E]/10 text-[#E53E3E] group-hover:bg-[#E53E3E] group-hover:text-white'}`}>
                            {tx.type === 'deposit' ? <ArrowUpRight size={24} strokeWidth={2.5} /> : <ArrowDownLeft size={24} strokeWidth={2.5} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-base font-black text-white tracking-tight uppercase">{tx.type}</p>
                              <div className="px-3 py-1 rounded-lg bg-gold-gradient text-black text-[8px] font-black uppercase tracking-widest shadow-lg">
                                VIP {tx.users?.vip_level || 0}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">{tx.users?.username}</p>
                              <div className="w-1 h-1 rounded-full bg-white/10" />
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-tight">Bal: ${parseFloat(tx.users?.balance || 0).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gold-gradient tracking-tighter">${parseFloat(tx.amount).toFixed(2)}</p>
                          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em] mt-1">Transaction ID: #{tx.id.slice(-6)}</p>
                        </div>
                      </div>

                      {/* Payment Proof Preview - Optimized Size */}
                      {tx.type === 'deposit' && tx.screenshot && (
                        <div className="mb-6 flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 group/proof">
                            <img src={tx.screenshot} alt="Proof" className="w-full h-full object-cover transition-transform group-hover/proof:scale-110" />
                            <a href={tx.screenshot} target="_blank" rel="noreferrer" className="absolute inset-0 z-10 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                              <ExternalLink size={12} className="text-white opacity-0 group-hover/proof:opacity-100 transition-opacity" />
                            </a>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#38A169]" />
                              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Receipt Verified</p>
                            </div>
                            <p className="text-[9px] font-medium text-white/20 leading-relaxed max-w-[200px]">Attached receipt for verification. Click the image to view the original full-size document.</p>
                            <a href={tx.screenshot} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[8px] font-black text-[#D4AF37] uppercase tracking-widest hover:brightness-125 transition-all">
                              View Original
                            </a>
                          </div>
                        </div>
                      )}
                      {tx.status === 'pending' && (
                        <div className="flex gap-4">
                          <button onClick={() => handleTransaction(tx.id, "approve")} disabled={processingId === tx.id || !canApproveFinance}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${canApproveFinance ? 'bg-[#38A169]/10 text-[#38A169] border border-[#38A169]/30 hover:bg-[#38A169] hover:text-white shadow-lg' : 'bg-white/5 text-white/10 border-white/5 cursor-not-allowed'}`}>
                            <CheckCircle2 size={16} />
                            Approve
                          </button>
                          <button onClick={() => handleTransaction(tx.id, "reject")} disabled={processingId === tx.id || !canApproveFinance}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${canApproveFinance ? 'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/30 hover:bg-[#E53E3E] hover:text-white shadow-lg' : 'bg-white/5 text-white/10 border-white/5 cursor-not-allowed'}`}>
                            <XCircle size={16} />
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
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 rounded-full bg-gold-gradient" />
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Stock Assets</h2>
                      <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Manage Platform Inventory</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingProduct(null); setShowAddProduct(true); }}
                    style={{ background: GOLDEN_GRADIENT, color: "#0D0D0D", boxShadow: "0 10px 40px rgba(212,175,55,0.3)" }}
                    className="h-12 px-8 rounded-[20px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl group">
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> 
                    Add New Asset
                  </button>
                </div>

                {/* Sub-navigation with golden accents */}
                <div className="p-1.5 bg-black/40 rounded-[22px] border border-white/5 flex gap-1 shadow-2xl">
                  {[1, 2, 3, "combos"].map(lvl => (
                    <button 
                      key={lvl} 
                      onClick={() => setProductTab(lvl as any)} 
                      className={`flex-1 py-4 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden ${
                        productTab === lvl 
                          ? "text-black" 
                          : "text-white/30 hover:text-white"
                      }`}
                    >
                      {productTab === lvl && (
                        <motion.div layoutId="prodTab" className="absolute inset-0 bg-gold-gradient shadow-lg" />
                      )}
                      <span className="relative z-10">{lvl === "combos" ? "Combos" : `VIP ${lvl}`}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {filteredProducts.map((product: any) => (
                    <motion.div 
                      layout
                      key={product.id} 
                      className="h-[280px] rounded-[32px] overflow-hidden bg-[#121212] border border-[#D4AF37]/10 flex flex-col group transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(212,175,55,0.05)] hover:translate-y-[-4px]"
                    >
                      <div className="h-[180px] relative bg-black/40 p-6 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                        <img 
                          src={product.image_url || product.image} 
                          alt={product.name} 
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
                        />
                        
                        {/* Status Badges */}
                        <div className="absolute top-4 left-4">
                          <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[7px] font-black text-[#D4AF37] uppercase tracking-widest">
                            {product.is_combo_item ? 'COMBO' : `TIER V${product.vip_level}`}
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3 backdrop-blur-[4px]">
                          <button onClick={() => setEditingProduct(product)} className="h-12 w-12 rounded-2xl bg-gold-gradient text-black shadow-xl hover:scale-110 active:scale-90 transition-all flex items-center justify-center"><Edit2 size={18} /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="h-12 w-12 rounded-2xl bg-[#E53E3E] text-white shadow-xl hover:scale-110 active:scale-90 transition-all flex items-center justify-center"><Trash2 size={18} /></button>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/40">
                        <div>
                          <p className="text-[11px] font-black text-white truncate uppercase tracking-tight leading-tight">{product.name}</p>
                          <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mt-1.5 opacity-80">
                            {product.is_combo_item ? 'Limited Edition' : `Access Level ${product.vip_level}`}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Base Price</span>
                            <p className="text-[13px] font-black text-white tracking-tighter">${product.price}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Commission</span>
                            <p className="text-[11px] font-black text-[#38A169]">+{product.commission_rate || product.commission}%</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white">{req.username}</p>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <p className="text-[10px] font-bold text-[#D4AF37]">V{req.vipLevel}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Requesting VIP {req.vipLevelRequest}</p>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <p className="text-[9px] font-black text-[#38A169] uppercase tracking-tighter">Current Bal: ${parseFloat(req.balance || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      <button onClick={() => handleLevelRequest(req._id, req.vipLevelRequest, 'approved')} disabled={!canApproveRequests || processingId === req._id}
                        className={`flex-1 md:w-36 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${canApproveRequests ? 'bg-[#38A169]/10 text-[#38A169] border border-[#38A169]/30 hover:bg-[#38A169] hover:text-white' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button onClick={() => handleLevelRequest(req._id, req.vipLevelRequest, 'rejected')} disabled={!canApproveRequests || processingId === req._id}
                        className={`flex-1 md:w-36 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${canApproveRequests ? 'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/20 hover:bg-[#E53E3E] hover:text-white' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {data.levelRequests.length === 0 && <div className="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">No pending requests</div>}
              </motion.div>
            )}
            {activeTab === "security" && (
              <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto">
                <div className="luxury-glass rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><Key size={120} className="text-[#D4AF37]" /></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]"><Key size={24} /></div>
                      <div><h2 className="text-xl font-black text-white tracking-tight uppercase">Admin Security</h2><p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Update Authentication Access</p></div>
                    </div>

                    <form onSubmit={handleAdminPasswordChange} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">Current Password</label>
                        <input type="password" required value={adminPasswordForm.currentPassword} onChange={e => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: e.target.value })}
                          placeholder="••••••••" className="w-full h-14 rounded-2xl bg-black/40 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/50 focus:bg-black/60 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">New Password</label>
                        <input type="password" required value={adminPasswordForm.newPassword} onChange={e => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                          placeholder="••••••••" className="w-full h-14 rounded-2xl bg-black/40 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/50 focus:bg-black/60 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">Confirm New Password</label>
                        <input type="password" required value={adminPasswordForm.confirmPassword} onChange={e => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                          placeholder="••••••••" className="w-full h-14 rounded-2xl bg-black/40 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/50 focus:bg-black/60 transition-all outline-none" />
                      </div>
                      <button type="submit" className="w-full h-14 rounded-2xl bg-gold-gradient text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="w-full max-w-md rounded-[40px] p-10 bg-[#0D0D0D] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative overflow-hidden"
            >
              {/* Refraction Effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4AF37]/10 blur-[80px] rounded-full" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-black uppercase text-white tracking-tighter">Update Account</h3>
                    <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.3em] mt-1">ID: {editingUser._id}</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all">
                    <XCircle size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">
                        <Users size={12} className="text-[#D4AF37]" /> Username
                      </label>
                      <input type="text" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} 
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/40 focus:bg-white/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">
                        <Key size={12} className="text-[#D4AF37]" /> Reset Pass
                      </label>
                      <input type="password" placeholder="Leave blank" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} 
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/40 focus:bg-white/10 transition-all outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">
                        <DollarSign size={12} className="text-[#D4AF37]" /> Balance ($)
                      </label>
                      <input type="number" step="0.01" value={editForm.balance} onChange={e => setEditForm({ ...editForm, balance: parseFloat(e.target.value) })} 
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/40 focus:bg-white/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">
                        <Crown size={12} className="text-[#D4AF37]" /> VIP Level
                      </label>
                      <div className="relative">
                        <select 
                          value={editForm.vipLevel} 
                          onChange={e => setEditForm({ ...editForm, vipLevel: parseInt(e.target.value) })}
                          className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/40 focus:bg-white/10 transition-all outline-none appearance-none cursor-pointer"
                        >
                          {[0, 1, 2, 3].map(lvl => (
                            <option key={lvl} value={lvl} className="bg-[#0D0D0D]">VIP {lvl}</option>
                          ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20"><Layers size={14} /></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">
                      <Wallet size={12} className="text-[#D4AF37]" /> Wallet Address
                    </label>
                    <input type="text" value={editForm.withdrawalAddress} onChange={e => setEditForm({ ...editForm, withdrawalAddress: e.target.value })} 
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white focus:border-[#D4AF37]/40 focus:bg-white/10 transition-all outline-none" />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${editForm.isTaskLocked ? 'bg-[#E53E3E]/20 text-[#E53E3E]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'}`}>
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">Lock Account Tasks</p>
                        <p className="text-[8px] font-bold text-white/20 uppercase">Prevent user from performing tasks</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditForm({ ...editForm, isTaskLocked: !editForm.isTaskLocked })} 
                      className={`w-14 h-7 rounded-full transition-all relative ${editForm.isTaskLocked ? 'bg-[#E53E3E]' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${editForm.isTaskLocked ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  <button type="submit" className="w-full h-16 rounded-[24px] bg-gold-gradient text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Save Changes
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {comboUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="w-full max-w-lg rounded-[40px] p-10 bg-[#0D0D0D] border border-[#38A169]/20 shadow-[0_50px_100px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto luxury-scrollbar relative"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black uppercase text-white tracking-tighter">Combo Scheduler</h3>
                  <p className="text-[9px] font-bold text-[#38A169] uppercase tracking-[0.3em] mt-1">Configuring: {comboUser.username}</p>
                </div>
                <button onClick={() => setComboUser(null)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              {userCombos.length > 0 && (
                <div className="mb-10 space-y-4">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1">Active Pipeline</p>
                  <div className="grid grid-cols-1 gap-3">
                    {userCombos.map((c, idx) => (
                      <div key={idx} className="p-5 rounded-[24px] bg-[#38A169]/5 border border-[#38A169]/10 flex items-center justify-between group transition-all hover:bg-[#38A169]/10">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-[#38A169]/20 flex items-center justify-center text-[#38A169] font-black text-xs">{c.position}</div>
                          <div>
                            <p className="text-[11px] font-black text-white uppercase">{c.items_count || c.itemsCount} Premium Items</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">${c.price} • {c.commission}% Growth</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCombo(c.id)} className="h-10 w-10 rounded-xl flex items-center justify-center text-white/10 hover:text-[#E53E3E] hover:bg-[#E53E3E]/10 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleComboSubmit} className="space-y-8">
                {comboForms.map((form, index) => (
                  <div key={index} className="p-8 rounded-[32px] bg-white/5 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Layers size={80} /></div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-[#38A169] tracking-[0.2em]">New Schedule #{index + 1}</span>
                        {comboForms.length > 1 && (
                          <button type="button" onClick={() => setComboForms(comboForms.filter((_, i) => i !== index))} className="text-[#E53E3E] text-[9px] font-black uppercase tracking-widest hover:underline">Remove</button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Position</label>
                          <input type="number" value={form.position} onChange={e => { const n = [...comboForms]; n[index].position = parseInt(e.target.value); setComboForms(n); }} 
                            className="w-full h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-sm font-bold text-white outline-none focus:border-[#38A169]/40 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Item Count</label>
                          <input type="number" value={form.itemsCount} onChange={e => { const n = [...comboForms]; n[index].itemsCount = parseInt(e.target.value); setComboForms(n); }} 
                            className="w-full h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-sm font-bold text-white outline-none focus:border-[#38A169]/40 transition-all" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Price ($)</label>
                          <input type="number" value={form.price} onChange={e => { const n = [...comboForms]; n[index].price = parseFloat(e.target.value); setComboForms(n); }} 
                            className="w-full h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-sm font-bold text-white outline-none focus:border-[#38A169]/40 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Commission (%)</label>
                          <input type="number" value={form.commission} onChange={e => { const n = [...comboForms]; n[index].commission = parseFloat(e.target.value); setComboForms(n); }} 
                            className="w-full h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-sm font-bold text-white outline-none focus:border-[#38A169]/40 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={() => setComboForms([...comboForms, { position: 5, itemsCount: 3, price: 100, commission: 20 }])} 
                  className="w-full py-5 rounded-[24px] border-2 border-dashed border-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#38A169]/30 hover:text-white transition-all">
                  <Plus size={16} /> Add Batch Set
                </button>

                <button type="submit" className="w-full h-16 rounded-[24px] bg-[#38A169] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(56,161,105,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Deploy All Schedules
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="w-full max-w-md rounded-[40px] p-10 bg-[#0D0D0D] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto luxury-scrollbar"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black uppercase text-white tracking-tighter">Store Inventory</h3>
                <button onClick={() => setShowAddProduct(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Product Name</label>
                  <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} 
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Asset URL (High Res)</label>
                  <input type="text" required value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} 
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-[10px] font-mono text-white/60 outline-none focus:border-[#D4AF37]/40 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Base Price ($)</label>
                    <input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} 
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Yield (%)</label>
                    <input type="number" required value={productForm.commission} onChange={e => setProductForm({ ...productForm, commission: parseFloat(e.target.value) })} 
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 transition-all" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">Target Access Tier</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3].map(lvl => (
                      <button key={lvl} type="button" onClick={() => setProductForm({ ...productForm, vip_level: lvl, is_combo_item: false })} 
                        className={`h-14 rounded-2xl text-[10px] font-black uppercase transition-all border ${productForm.vip_level === lvl && !productForm.is_combo_item 
                          ? 'bg-gold-gradient text-black border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                          : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10 hover:text-white'}`}>
                        V{lvl}
                      </button>
                    ))}
                    <button type="button" onClick={() => setProductForm({ ...productForm, is_combo_item: true })} 
                      className={`h-14 rounded-2xl text-[10px] font-black uppercase transition-all border ${productForm.is_combo_item 
                        ? 'bg-[#38A169] text-white border-transparent shadow-[0_0_20px_rgba(56,161,105,0.3)]' 
                        : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10 hover:text-white'}`}>
                      Combo
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full h-16 rounded-[24px] bg-gold-gradient text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                  Initialize Product
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
        {userToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-[32px] p-8 bg-[#141414] border border-[#E53E3E]/40 shadow-[0_0_50px_rgba(229,62,62,0.2)] text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#E53E3E]/10 flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-[#E53E3E]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Delete User?</h3>
              <p className="text-[11px] font-medium text-white/40 leading-relaxed mb-8 px-4">
                You are about to permanently delete <span className="text-white font-bold">{userToDelete.username}</span>. This action cannot be undone and will wipe all their data.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-4 rounded-2xl bg-[#E53E3E] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#E53E3E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  No
                </button>
                <button 
                  onClick={handleDeleteUser}
                  className="flex-1 py-4 rounded-2xl bg-[#38A169] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#38A169]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {viewingReferrals && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-[32px] p-8 bg-[#141414] border border-[#D4AF37]/20 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-widest">Referral Network</h3>
                  <p className="text-[10px] font-bold text-[#D4AF37] mt-1">{viewingReferrals.username}&apos;s Invites</p>
                </div>
                <button onClick={() => setViewingReferrals(null)}>
                  <XCircle className="text-white/30 hover:text-white transition-all" size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto luxury-scrollbar pr-2 space-y-3">
                {data.users.filter((u: any) => u.referredBy === viewingReferrals._id).length > 0 ? (
                  data.users
                    .filter((u: any) => u.referredBy === viewingReferrals._id)
                    .map((ref: any) => (
                      <div key={ref._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center font-black text-[10px] text-[#D4AF37]">
                            {ref.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{ref.username}</p>
                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                              Joined {new Date(ref.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gold-gradient">${(ref.balance || 0).toFixed(2)}</p>
                          <p className="text-[7px] font-bold text-[#D4AF37] uppercase">V{ref.vipLevel || 1}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="py-12 text-center">
                    <Share2 className="mx-auto text-white/10 mb-4" size={32} />
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No referrals found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Admin Error Modal */}
        {modalError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm luxury-glass rounded-[40px] p-8 text-center border border-[#E53E3E]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="w-20 h-20 rounded-3xl bg-[#E53E3E]/10 flex items-center justify-center mx-auto mb-6 border border-[#E53E3E]/20">
                <AlertCircle size={40} className="text-[#E53E3E]" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Operation Failed</h3>
              <p className="text-[12px] font-medium text-white/60 leading-relaxed mb-8 px-4">{modalError}</p>
              <button onClick={() => setModalError(null)} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-black uppercase text-[10px] tracking-widest hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all">Close</button>
            </motion.div>
          </motion.div>
        )}

        {/* Admin Success Modal */}
        {successMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm luxury-glass rounded-[40px] p-8 text-center border border-[#38A169]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="w-20 h-20 rounded-3xl bg-[#38A169]/10 flex items-center justify-center mx-auto mb-6 border border-[#38A169]/20">
                <CheckCircle2 size={40} className="text-[#38A169]" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Success</h3>
              <p className="text-[12px] font-medium text-white/60 leading-relaxed mb-8 px-4">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-black uppercase text-[10px] tracking-widest hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all">Continue</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}