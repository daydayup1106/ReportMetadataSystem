import { create } from 'zustand'
import type { User } from '@/types/api'
import { authApi, usersApi } from '@/api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  setUser: (user: User | null) => void
  setAuth: (accessToken: string, refreshToken: string, user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.login({ email, password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ user: data.user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.register({ email, password, display_name: displayName })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ user: data.user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false })
    }
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const { data } = await usersApi.getMe()
      set({ user: data, isAuthenticated: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    set({ user, isAuthenticated: true })
  },
}))
