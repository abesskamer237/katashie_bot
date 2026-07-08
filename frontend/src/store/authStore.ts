import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * SÉCURITÉ — Stratégie de stockage des tokens :
 *
 * - accessToken  : mémoire uniquement (runtime JS), jamais en localStorage.
 *   Disparaît à la fermeture de l'onglet → l'utilisateur est déconnecté.
 *   Non accessible par un script XSS persistant entre sessions.
 *
 * - refreshToken : sessionStorage uniquement (pas localStorage).
 *   Limité à l'onglet courant, effacé à la fermeture de l'onglet.
 *   Meilleur compromis UX/sécurité sans serveur HttpOnly cookie.
 *
 * - user (données non sensibles) : persisté en localStorage pour UX.
 *   Ne contient jamais de token, mot de passe, ou donnée financière brute.
 *
 * Pour une sécurité maximale (production multi-tenant), migrez vers
 * un HttpOnly+Secure+SameSite=Strict cookie pour le refreshToken,
 * géré côté serveur avec rotation après chaque utilisation.
 */

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;   // mémoire uniquement — pas persisté
  refreshToken: string | null;  // sessionStorage uniquement — effacé à la fermeture
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateCredits: (credits: number) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

// Stockage hybride : localStorage pour user/isAuthenticated, sessionStorage pour refreshToken
const sessionStorageMiddleware = {
  getItem: (name: string) => {
    const lsData = localStorage.getItem(name);
    const ssRefresh = sessionStorage.getItem('katashie_rt');
    if (!lsData) return null;
    try {
      const parsed = JSON.parse(lsData);
      if (ssRefresh && parsed?.state) {
        parsed.state.refreshToken = ssRefresh;
      }
      return JSON.stringify(parsed);
    } catch {
      return lsData;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      const parsed = JSON.parse(value);
      // Stocker le refreshToken dans sessionStorage (pas localStorage)
      if (parsed?.state?.refreshToken) {
        sessionStorage.setItem('katashie_rt', parsed.state.refreshToken);
        // Ne pas persister le refreshToken ni l'accessToken en localStorage
        delete parsed.state.refreshToken;
        delete parsed.state.accessToken;
      }
      localStorage.setItem(name, JSON.stringify(parsed));
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem('katashie_rt');
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: sessionStorage.getItem('katashie_rt') || null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        sessionStorage.setItem('katashie_rt', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        sessionStorage.removeItem('katashie_rt');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setTokens: (accessToken, refreshToken) => {
        sessionStorage.setItem('katashie_rt', refreshToken);
        set({ accessToken, refreshToken });
      },

      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),

      updateCredits: (credits) =>
        set((state) => ({ user: state.user ? { ...state.user, credits } : null })),
    }),
    {
      name: 'katashie-auth',
      storage: sessionStorageMiddleware as any,
      // Ne persister que les données non sensibles en localStorage
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
