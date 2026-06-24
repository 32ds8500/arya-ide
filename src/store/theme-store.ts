import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const resolveTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') return getSystemTheme();
  return theme;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolvedTheme: 'dark',

      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ theme: next, resolvedTheme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
        document.documentElement.classList.toggle('light', next === 'light');
      },

      setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        set({ theme, resolvedTheme: resolved });
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        document.documentElement.classList.toggle('light', resolved === 'light');
      },
    }),
    {
      name: 'arya-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          state.resolvedTheme = resolved;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', resolved === 'dark');
            document.documentElement.classList.toggle('light', resolved === 'light');
          }
        }
      },
    }
  )
);
