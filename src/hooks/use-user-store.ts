
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: number;
  role: string;
  doctor_id?: number;
  name?: string;
  specialization?: string;
  department?: string;
  email?: string;
}

type UserState = {
  avatar: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAvatar: (avatar: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  getDoctorId: () => number | null;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      avatar: null,
      user: null,
      hasHydrated: false,
      setAvatar: (avatar) => set({ avatar }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, avatar: null }),
      isAuthenticated: () => !!get().user,
      getDoctorId: () => get().user?.doctor_id || null,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'user-storage', 
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
