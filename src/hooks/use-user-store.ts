
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
  refreshUser: () => Promise<void>;
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
      refreshUser: async () => {
        const currentUser = get().user;
        if (!currentUser?.doctor_id) return;

        try {
          const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doctors.php?doctor_id=${currentUser.doctor_id}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            const refreshedUser = {
              ...currentUser,
              name: data.data.name,
              email: data.data.email,
              department: data.data.department,
              specialization: data.data.specialization
            };
            
            set({ user: refreshedUser });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
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
