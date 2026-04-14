import { create } from 'zustand'
import type { Comment, Post, TrendingTag } from '@/types/api'
import { communityApi } from '@/api/client'

type TabType = 'all' | 'research' | 'discussions'
type SortType = 'latest' | 'popular'

interface CommunityState {
  /* list */
  posts: Post[]
  total: number
  page: number
  isLoading: boolean

  /* filters */
  activeTab: TabType
  activeTag: string | null
  sortBy: SortType

  /* detail */
  selectedPost: Post | null
  comments: Comment[]
  isDetailLoading: boolean

  /* trending */
  trendingTags: TrendingTag[]

  /* create dialog */
  isCreateDialogOpen: boolean
  setCreateDialogOpen: (open: boolean) => void

  /* actions */
  setActiveTab: (tab: TabType) => void
  setActiveTag: (tag: string | null) => void
  setSortBy: (sort: SortType) => void
  fetchPosts: (page?: number) => Promise<void>
  fetchPost: (postId: string) => Promise<void>
  createPost: (data: { post_type: string; title: string; content: string; source?: string; tags?: string[] }) => Promise<void>
  toggleLike: (postId: string) => void
  addComment: (postId: string, content: string, parentId?: string) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  fetchTrending: () => Promise<void>
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  total: 0,
  page: 1,
  isLoading: false,

  activeTab: 'all',
  activeTag: null,
  sortBy: 'latest',

  selectedPost: null,
  comments: [],
  isDetailLoading: false,

  trendingTags: [],

  isCreateDialogOpen: false,
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),

  setActiveTab: (tab) => {
    set({ activeTab: tab, page: 1 })
    get().fetchPosts(1)
  },

  setActiveTag: (tag) => {
    set({ activeTag: tag, page: 1 })
    get().fetchPosts(1)
  },

  setSortBy: (sort) => {
    set({ sortBy: sort, page: 1 })
    get().fetchPosts(1)
  },

  fetchPosts: async (page = 1) => {
    set({ isLoading: true })
    try {
      const { activeTab, activeTag, sortBy } = get()
      const type = activeTab === 'research' ? 'research_share' : activeTab === 'discussions' ? 'discussion' : undefined
      const { data } = await communityApi.listPosts({ type, tag: activeTag ?? undefined, sort: sortBy, page, limit: 20 })
      set({ posts: data.posts, total: data.total, page: data.page })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPost: async (postId) => {
    set({ isDetailLoading: true })
    try {
      const { data } = await communityApi.getPost(postId)
      set({ selectedPost: data.post, comments: data.comments })
    } finally {
      set({ isDetailLoading: false })
    }
  },

  createPost: async (data) => {
    await communityApi.createPost(data)
    set({ isCreateDialogOpen: false })
    get().fetchPosts(1)
  },

  toggleLike: async (postId) => {
    // Optimistic update in list
    const { posts, selectedPost } = get()
    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        const newLiked = !p.is_liked
        return { ...p, is_liked: newLiked, like_count: p.like_count + (newLiked ? 1 : -1) }
      }
      return p
    })
    set({ posts: updatedPosts })

    // Optimistic update in detail
    if (selectedPost?.id === postId) {
      const newLiked = !selectedPost.is_liked
      set({ selectedPost: { ...selectedPost, is_liked: newLiked, like_count: selectedPost.like_count + (newLiked ? 1 : -1) } })
    }

    try {
      const { data } = await communityApi.toggleLike(postId)
      // Reconcile with server response
      const reconciled = get().posts.map((p) =>
        p.id === postId ? { ...p, is_liked: data.liked, like_count: data.like_count } : p,
      )
      set({ posts: reconciled })
      if (get().selectedPost?.id === postId) {
        set({ selectedPost: { ...get().selectedPost!, is_liked: data.liked, like_count: data.like_count } })
      }
    } catch {
      // Revert on error
      get().fetchPosts(get().page)
    }
  },

  addComment: async (postId, content, parentId) => {
    const { data } = await communityApi.addComment(postId, { content, parent_id: parentId })
    set((state) => ({
      comments: [...state.comments, data],
      selectedPost: state.selectedPost
        ? { ...state.selectedPost, comment_count: state.selectedPost.comment_count + 1 }
        : null,
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
      ),
    }))
  },

  deletePost: async (postId) => {
    await communityApi.deletePost(postId)
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      total: state.total - 1,
    }))
  },

  fetchTrending: async () => {
    try {
      const { data } = await communityApi.getTrending(10)
      set({ trendingTags: data })
    } catch {
      // Trending is non-critical
    }
  },
}))
