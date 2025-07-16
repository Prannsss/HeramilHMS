
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

type UserState = {
  avatar: string | null;
  setAvatar: (avatar: string | null) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      avatar: null,
      setAvatar: (avatar) => set({ avatar }),
    }),
    {
      name: 'user-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
