import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppTab {
  id: string;
  title: string;
  icon?: string;
  paciente_id: string;
  paciente_nombre: string;
  nhc: string;
  episodio_id?: string;
  episodio_tipo?: string;
  modulo_activo: string;
  timestamp_apertura: number;
  datos_contexto?: Record<string, any>;
}

interface TabsStore {
  tabs: AppTab[];
  activeTabId: string | null;
  maxTabsAbiertos: number;

  openTab: (tab: Omit<AppTab, 'id' | 'timestamp_apertura'>) => string;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  switchTab: (tabId: string) => void;
  updateTabContext: (tabId: string, context: Record<string, any>) => void;
  getActiveTab: () => AppTab | undefined;
  getTabCount: () => number;
  canOpenMore: () => boolean;
}

const createTabId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      maxTabsAbiertos: 5,

      openTab: (tab) => {
        const state = get();
        const tabId = createTabId();

        const existingTab = state.tabs.find(
          (t) => t.paciente_id === tab.paciente_id && t.modulo_activo === tab.modulo_activo
        );

        if (existingTab) {
          set({ activeTabId: existingTab.id });
          return existingTab.id;
        }

        let newTabs = [...state.tabs];
        if (newTabs.length >= state.maxTabsAbiertos) {
          newTabs = newTabs.slice(1);
        }

        const newTab: AppTab = {
          ...tab,
          id: tabId,
          timestamp_apertura: Date.now(),
        };

        newTabs.push(newTab);
        set({ tabs: newTabs, activeTabId: tabId });

        return tabId;
      },

      closeTab: (tabId) => {
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          const newActiveTabId =
            state.activeTabId === tabId
              ? newTabs.length > 0
                ? newTabs[newTabs.length - 1].id
                : null
              : state.activeTabId;

          return {
            tabs: newTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      closeAllTabs: () => {
        set({ tabs: [], activeTabId: null });
      },

      switchTab: (tabId) => {
        const state = get();
        if (state.tabs.find((t) => t.id === tabId)) {
          set({ activeTabId: tabId });
        }
      },

      updateTabContext: (tabId, context) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  datos_contexto: { ...t.datos_contexto, ...context },
                }
              : t
          ),
        }));
      },

      getActiveTab: () => {
        const state = get();
        return state.tabs.find((t) => t.id === state.activeTabId);
      },

      getTabCount: () => get().tabs.length,

      canOpenMore: () => get().tabs.length < get().maxTabsAbiertos,
    }),
    {
      name: 'hosix-tabs-storage',
      version: 1,
    }
  )
);

export default useTabsStore;
