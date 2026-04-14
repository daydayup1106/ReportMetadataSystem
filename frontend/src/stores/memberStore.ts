import { create } from 'zustand'
import type { UserRelation } from '@/types/api'
import { membersApi } from '@/api/client'

interface MemberState {
  members: UserRelation[]
  isLoading: boolean
  hasMultipleMembers: boolean

  fetchMembers: (withData?: boolean) => Promise<void>
  getSelfMember: () => UserRelation | undefined
  getMemberById: (id: string) => UserRelation | undefined
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  isLoading: false,
  hasMultipleMembers: false,

  fetchMembers: async (withData?: boolean) => {
    set({ isLoading: true })
    try {
      const { data } = await membersApi.list(withData)
      set({
        members: data.members,
        hasMultipleMembers: data.members.length > 1,
      })
    } catch {
      // Keep existing data on error
    } finally {
      set({ isLoading: false })
    }
  },

  getSelfMember: () => {
    return get().members.find((m) => m.is_owner)
  },

  getMemberById: (id: string) => {
    return get().members.find((m) => m.id === id)
  },
}))
