// src/stores/notificationStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationStore {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  devtools((set) => ({
    notifications: [],

    addNotification: (notification) => {
      const id = crypto.randomUUID()
      set((state) => ({
        notifications: [...state.notifications, { ...notification, id }],
      }))

      // Auto-remove después del duration
      if (notification.duration) {
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }))
        }, notification.duration)
      }
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    },

    clearAll: () => {
      set({ notifications: [] })
    },
  }))
)
