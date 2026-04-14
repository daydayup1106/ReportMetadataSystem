import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotificationStore } from '@/stores/notificationStore'

vi.mock('@/api/client', () => ({
  notificationApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

import { notificationApi } from '@/api/client'

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      pollInterval: null,
    })
  })

  afterEach(() => {
    // Clean up polling
    useNotificationStore.getState().stopPolling()
    vi.useRealTimers()
  })

  describe('fetchNotifications', () => {
    it('loads notifications from API', async () => {
      const mockNotifications = [
        { id: '1', type: 'community', title: 'New comment', is_read: false },
        { id: '2', type: 'system', title: 'Welcome', is_read: true },
      ]
      vi.mocked(notificationApi.list).mockResolvedValue({
        data: { notifications: mockNotifications, total: 2, unread_count: 1 },
      } as never)

      await useNotificationStore.getState().fetchNotifications()

      const state = useNotificationStore.getState()
      expect(state.notifications).toEqual(mockNotifications)
      expect(state.unreadCount).toBe(1)
      expect(state.isLoading).toBe(false)
    })

    it('sets isLoading during fetch', async () => {
      let resolve: (v: unknown) => void
      vi.mocked(notificationApi.list).mockImplementation(
        () => new Promise((r) => { resolve = r }) as never
      )

      const promise = useNotificationStore.getState().fetchNotifications()
      expect(useNotificationStore.getState().isLoading).toBe(true)

      resolve!({ data: { notifications: [], total: 0, unread_count: 0 } })
      await promise
      expect(useNotificationStore.getState().isLoading).toBe(false)
    })
  })

  describe('fetchUnreadCount', () => {
    it('updates unread count', async () => {
      vi.mocked(notificationApi.unreadCount).mockResolvedValue({
        data: { count: 5 },
      } as never)

      await useNotificationStore.getState().fetchUnreadCount()
      expect(useNotificationStore.getState().unreadCount).toBe(5)
    })

    it('silently handles errors', async () => {
      vi.mocked(notificationApi.unreadCount).mockRejectedValue(new Error('fail'))
      await useNotificationStore.getState().fetchUnreadCount()
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe('markRead', () => {
    it('marks specific notifications as read', async () => {
      useNotificationStore.setState({
        notifications: [
          { id: '1', is_read: false } as never,
          { id: '2', is_read: false } as never,
          { id: '3', is_read: false } as never,
        ],
        unreadCount: 3,
      })
      vi.mocked(notificationApi.markRead).mockResolvedValue({
        data: { updated: 2 },
      } as never)

      await useNotificationStore.getState().markRead(['1', '2'])

      const state = useNotificationStore.getState()
      expect(state.notifications[0].is_read).toBe(true)
      expect(state.notifications[1].is_read).toBe(true)
      expect(state.notifications[2].is_read).toBe(false)
      expect(state.unreadCount).toBe(1)
    })
  })

  describe('markAllRead', () => {
    it('marks all notifications as read', async () => {
      useNotificationStore.setState({
        notifications: [
          { id: '1', is_read: false } as never,
          { id: '2', is_read: false } as never,
        ],
        unreadCount: 2,
      })
      vi.mocked(notificationApi.markAllRead).mockResolvedValue({
        data: { updated: 2 },
      } as never)

      await useNotificationStore.getState().markAllRead()

      const state = useNotificationStore.getState()
      expect(state.notifications.every((n) => n.is_read)).toBe(true)
      expect(state.unreadCount).toBe(0)
    })
  })

  describe('polling', () => {
    it('starts and stops polling', async () => {
      vi.mocked(notificationApi.unreadCount).mockResolvedValue({
        data: { count: 0 },
      } as never)

      useNotificationStore.getState().startPolling()
      expect(useNotificationStore.getState().pollInterval).not.toBeNull()

      // Should have called fetchUnreadCount immediately
      expect(notificationApi.unreadCount).toHaveBeenCalledTimes(1)

      // Advance 30 seconds
      await vi.advanceTimersByTimeAsync(30000)
      expect(notificationApi.unreadCount).toHaveBeenCalledTimes(2)

      useNotificationStore.getState().stopPolling()
      expect(useNotificationStore.getState().pollInterval).toBeNull()

      // No more calls after stopping
      await vi.advanceTimersByTimeAsync(30000)
      expect(notificationApi.unreadCount).toHaveBeenCalledTimes(2)
    })

    it('does not start duplicate polling', () => {
      vi.mocked(notificationApi.unreadCount).mockResolvedValue({
        data: { count: 0 },
      } as never)

      useNotificationStore.getState().startPolling()
      const firstInterval = useNotificationStore.getState().pollInterval

      useNotificationStore.getState().startPolling()
      const secondInterval = useNotificationStore.getState().pollInterval

      expect(firstInterval).toBe(secondInterval)
    })
  })
})
