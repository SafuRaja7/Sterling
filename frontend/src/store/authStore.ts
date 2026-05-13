import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  permissions?: any;
  todayEarning?: number;
  yesterdayEarning?: number;
  vipLevelRequest?: number;
  vipLevelRequestStatus?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),

      setUser: (user) => set({ user, isAuthenticated: true })
    }),
    {
      name: 'sterling-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
