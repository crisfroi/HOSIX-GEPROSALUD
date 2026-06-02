// src/stores/uiStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  isMobile: boolean
  setIsMobile: (mobile: boolean) => void
}

export const useUIStore = create<UIStore>()(
  devtools((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    isMobile: false,
    setIsMobile: (mobile) => set({ isMobile: mobile }),
  }))
)
