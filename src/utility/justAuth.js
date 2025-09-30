// justAuth.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function getTokenExpMs(token) {
  try {
  const [, payload] = token.split('.') || [];
  if (!payload) return null;
  // base64url -> base64
  let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  // pad
  while (b64.length % 4) b64 += '=';
  const json = JSON.parse(atob(b64));
    return json?.exp ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

let expiryTimeoutId = null;
function scheduleAutoLogout(state, token) {
  if (expiryTimeoutId) {
    clearTimeout(expiryTimeoutId);
    expiryTimeoutId = null;
  }
  const expMs = token ? getTokenExpMs(token) : null;
  if (!expMs) return;
  const delay = expMs - Date.now();
  if (delay <= 0) {
    state.logout();
    return;
  }
  expiryTimeoutId = setTimeout(() => {
    state.logout();
  }, delay);
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      isLoggedIn: false,
      hasHydrated: false,
      user: {
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        id: ''
      },

      // Set hydration status
      setHasHydrated: (status) => {
        set({ hasHydrated: status });
      },

      login: (token, userData) => {
        localStorage.clear();
        set({
          token,
          isLoggedIn: true,
          user: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role,
            id: userData.id
          },
        });
        // Set up auto-logout based on token expiry
        scheduleAutoLogout({ logout: get().logout }, token);
      },

      logout: () => {
        set({
          token: null,
          isLoggedIn: false,
          user: {
            firstName: '',
            lastName: '',
            email: '',
            role: '',
            id: ''
          },
        });
        if (expiryTimeoutId) {
          clearTimeout(expiryTimeoutId);
          expiryTimeoutId = null;
        }
      },

  // Removed cookie-based sync: HttpOnly cookie isn't readable; rely on in-store token

      updateUser: (newUserData) =>
        set((state) => ({
          user: {
            ...state.user,
            ...newUserData,
          },
        })),
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      onRehydrateStorage: () => (state) => {
        // Runs after the store has been rehydrated from localStorage
        if (state) {
          state.setHasHydrated(true);
          // If a token exists in store, reschedule auto-logout from its exp
          const token = state.token;
          if (token) {
            scheduleAutoLogout({ logout: state.logout }, token);
          }
        }
      },
    }
  )
);

export default useAuthStore;
