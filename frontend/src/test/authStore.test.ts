import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

// Mock API modules
vi.mock('@/api/client', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  usersApi: {
    getMe: vi.fn(),
  },
}))

import { authApi, usersApi } from '@/api/client'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  describe('initial state', () => {
    it('starts unauthenticated with no user', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('login', () => {
    it('stores tokens and sets user on success', async () => {
      const mockUser = { id: '1', email: 'test@test.com', display_name: 'Test' }
      vi.mocked(authApi.login).mockResolvedValue({
        data: {
          access_token: 'access-123',
          refresh_token: 'refresh-123',
          token_type: 'bearer',
          user: mockUser,
        },
      } as never)

      await useAuthStore.getState().login('test@test.com', 'password')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-123')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-123')
    })

    it('sets isLoading during login', async () => {
      let resolveLogin: (value: unknown) => void
      vi.mocked(authApi.login).mockImplementation(() =>
        new Promise((resolve) => { resolveLogin = resolve }) as never
      )

      const loginPromise = useAuthStore.getState().login('test@test.com', 'pass')
      expect(useAuthStore.getState().isLoading).toBe(true)

      resolveLogin!({
        data: {
          access_token: 'a', refresh_token: 'r', token_type: 'bearer',
          user: { id: '1', email: 'test@test.com', display_name: 'Test' },
        },
      })
      await loginPromise
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('resets isLoading on login failure', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))

      await expect(
        useAuthStore.getState().login('test@test.com', 'wrong')
      ).rejects.toThrow()

      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('stores tokens and sets user on success', async () => {
      const mockUser = { id: '2', email: 'new@test.com', display_name: 'New User' }
      vi.mocked(authApi.register).mockResolvedValue({
        data: {
          access_token: 'access-new',
          refresh_token: 'refresh-new',
          token_type: 'bearer',
          user: mockUser,
        },
      } as never)

      await useAuthStore.getState().register('new@test.com', 'password', 'New User')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-new')
    })
  })

  describe('logout', () => {
    it('clears tokens and user state', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@test.com', display_name: 'Test' } as never,
        isAuthenticated: true,
      })
      vi.mocked(authApi.logout).mockResolvedValue({} as never)

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token')
    })

    it('clears state even if logout API fails', async () => {
      useAuthStore.setState({
        user: { id: '1' } as never,
        isAuthenticated: true,
      })
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'))

      // logout uses try/finally so the error propagates, but state is cleared
      try {
        await useAuthStore.getState().logout()
      } catch {
        // Expected — error propagates through finally
      }

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('fetchUser', () => {
    it('sets user on success', async () => {
      const mockUser = { id: '1', email: 'test@test.com', display_name: 'Test' }
      vi.mocked(usersApi.getMe).mockResolvedValue({ data: mockUser } as never)

      await useAuthStore.getState().fetchUser()

      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('clears auth on fetch failure', async () => {
      useAuthStore.setState({ isAuthenticated: true })
      vi.mocked(usersApi.getMe).mockRejectedValue(new Error('Unauthorized'))

      await useAuthStore.getState().fetchUser()

      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('setAuth', () => {
    it('stores tokens and sets user directly', () => {
      const mockUser = { id: '3', email: 'sms@test.com', display_name: 'SMS User' } as never

      useAuthStore.getState().setAuth('sms-access', 'sms-refresh', mockUser)

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'sms-access')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'sms-refresh')
    })
  })

  describe('setUser', () => {
    it('sets authenticated when user is provided', () => {
      useAuthStore.getState().setUser({ id: '1' } as never)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('sets unauthenticated when user is null', () => {
      useAuthStore.setState({ isAuthenticated: true })
      useAuthStore.getState().setUser(null)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
