import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarPanel = 'files' | 'search' | 'git' | 'extensions' | 'chat' | 'settings';

interface SidebarStore {
  isOpen: boolean;
  activePanel: SidebarPanel;
  width: number;

  toggle: () => void;
  open: () => void;
  close: () => void;
  setActivePanel: (panel: SidebarPanel) => void;
  setWidth: (width: number) => void;
  togglePanel: (panel: SidebarPanel) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      isOpen: true,
      activePanel: 'files',
      width: 260,

      toggle: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      open: () => set({ isOpen: true }),

      close: () => set({ isOpen: false }),

      setActivePanel: (panel) => {
        const current = get();
        if (current.isOpen && current.activePanel === panel) {
          set({ isOpen: false });
        } else {
          set({ activePanel: panel, isOpen: true });
        }
      },

      setWidth: (width) => {
        const clamped = Math.max(180, Math.min(600, width));
        set({ width: clamped });
      },

      togglePanel: (panel) => {
        const { isOpen, activePanel } = get();
        if (isOpen && activePanel === panel) {
          set({ isOpen: false });
        } else {
          set({ activePanel: panel, isOpen: true });
        }
      },
    }),
    {
      name: 'arya-sidebar',
      partialize: (state) => ({
        isOpen: state.isOpen,
        activePanel: state.activePanel,
        width: state.width,
      }),
    }
  )
);
