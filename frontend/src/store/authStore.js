import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,   // true while hydrating from /auth/me on app load
  error: null,

  // Called once on app mount to rehydrate session from cookie
  hydrate: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.data.user });
    return data.data.user;
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null });
  },

  setUser: (user) => set({ user }),

  isAuthenticated: () => !!get().user,
  isAlumni: () => get().user?.role === 'alumni',
  isStudent: () => get().user?.role === 'student',
  isAdmin: () => get().user?.role === 'admin',
}));

export default useAuthStore;
