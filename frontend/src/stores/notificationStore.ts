import { create } from 'zustand'
import type { Notification } from '@/types/api'
import { notificationApi } from '@/api/client'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  pollInterval: ReturnType<typeof setInterval> | null

  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markRead: (ids: string[]) => Promise<void>
  markAllRead: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pollInterval: null,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const { data } = await notificationApi.list({ limit: 20 })
      set({
        notifications: data.notifications,
        unreadCount: data.unread_count,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationApi.unreadCount()
      set({ unreadCount: data.count })
    } catch {
      // Non-critical
    }
  },

  markRead: async (ids) => {
    await notificationApi.markRead(ids)
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - ids.filter((id) =>
        state.notifications.find((n) => n.id === id && !n.is_read),
      ).length),
    }))
  },

  markAllRead: async () => {
    await notificationApi.markAllRead()
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  startPolling: () => {
    const { pollInterval } = get()
    if (pollInterval) return // Already polling
    get().fetchUnreadCount()
    const interval = setInterval(() => {
      get().fetchUnreadCount()
    }, 30000) // 30 seconds
    set({ pollInterval: interval })
  },

  stopPolling: () => {
    const { pollInterval } = get()
    if (pollInterval) {
      clearInterval(pollInterval)
      set({ pollInterval: null })
    }
  },
}))
