import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserData = { id: string; name: string; email: string; shopName: string };
type User = UserData | null;

interface AuthState {
  token: string | null;
  user: User;
  setAuth: (token: string, user: User) => void;
  updateUser: (patch: Partial<UserData>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (patch) => set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),
      logout: () => set({ token: null, user: null })
    }),
    { name: 'auth-storage' }
  )
);
