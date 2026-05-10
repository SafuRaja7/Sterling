import { create } from 'zustand';

interface User {
  _id: string;
  username: string;
  email?: string;
  role: string;
  balance: number;
  vipLevel: number;
  completedTasksToday: number;
  avatar?: string;
  totalCommission?: number;
  totalAssets?: number;
  inviteCode?: string;
  dailyProfit?: number;
  dailyTasks?: number;
  withdrawalAddress?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null
  })),

  setUser: (user) => set({ user, isAuthenticated: true })
}));
