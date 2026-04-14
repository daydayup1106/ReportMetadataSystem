import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCommunityStore } from '@/stores/communityStore'

vi.mock('@/api/client', () => ({
  communityApi: {
    listPosts: vi.fn(),
    createPost: vi.fn(),
    getPost: vi.fn(),
    deletePost: vi.fn(),
    toggleLike: vi.fn(),
    addComment: vi.fn(),
    getTrending: vi.fn(),
  },
}))

import { communityApi } from '@/api/client'

describe('communityStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCommunityStore.setState({
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
    })
  })

  describe('fetchPosts', () => {
    it('loads posts from API', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', like_count: 0, comment_count: 0, is_liked: false },
        { id: '2', title: 'Post 2', like_count: 3, comment_count: 1, is_liked: true },
      ]
      vi.mocked(communityApi.listPosts).mockResolvedValue({
        data: { posts: mockPosts, total: 2, page: 1, limit: 20 },
      } as never)

      await useCommunityStore.getState().fetchPosts()

      expect(useCommunityStore.getState().posts).toEqual(mockPosts)
      expect(useCommunityStore.getState().total).toBe(2)
      expect(useCommunityStore.getState().isLoading).toBe(false)
    })

    it('passes filter params to API', async () => {
      useCommunityStore.setState({
        activeTab: 'research',
        activeTag: 'diabetes',
        sortBy: 'popular',
      })
      vi.mocked(communityApi.listPosts).mockResolvedValue({
        data: { posts: [], total: 0, page: 1, limit: 20 },
      } as never)

      await useCommunityStore.getState().fetchPosts(2)

      expect(communityApi.listPosts).toHaveBeenCalledWith({
        type: 'research_share',
        tag: 'diabetes',
        sort: 'popular',
        page: 2,
        limit: 20,
      })
    })

    it('maps discussions tab to discussion type', async () => {
      useCommunityStore.setState({ activeTab: 'discussions' })
      vi.mocked(communityApi.listPosts).mockResolvedValue({
        data: { posts: [], total: 0, page: 1, limit: 20 },
      } as never)

      await useCommunityStore.getState().fetchPosts()

      expect(communityApi.listPosts).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'discussion' })
      )
    })

    it('maps all tab to undefined type', async () => {
      useCommunityStore.setState({ activeTab: 'all' })
      vi.mocked(communityApi.listPosts).mockResolvedValue({
        data: { posts: [], total: 0, page: 1, limit: 20 },
      } as never)

      await useCommunityStore.getState().fetchPosts()

      expect(communityApi.listPosts).toHaveBeenCalledWith(
        expect.objectContaining({ type: undefined })
      )
    })
  })

  describe('toggleLike', () => {
    it('optimistically updates like state', async () => {
      useCommunityStore.setState({
        posts: [
          { id: '1', is_liked: false, like_count: 5 } as never,
        ],
      })
      vi.mocked(communityApi.toggleLike).mockResolvedValue({
        data: { liked: true, like_count: 6 },
      } as never)

      // Fire and don't await — check optimistic state
      const promise = useCommunityStore.getState().toggleLike('1')

      // Optimistic: immediately flipped
      const optimistic = useCommunityStore.getState().posts[0]
      expect(optimistic.is_liked).toBe(true)
      expect(optimistic.like_count).toBe(6)

      await promise

      // Reconciled with server
      const reconciled = useCommunityStore.getState().posts[0]
      expect(reconciled.is_liked).toBe(true)
      expect(reconciled.like_count).toBe(6)
    })

    it('updates detail view too', async () => {
      useCommunityStore.setState({
        posts: [{ id: '1', is_liked: false, like_count: 0 } as never],
        selectedPost: { id: '1', is_liked: false, like_count: 0 } as never,
      })
      vi.mocked(communityApi.toggleLike).mockResolvedValue({
        data: { liked: true, like_count: 1 },
      } as never)

      await useCommunityStore.getState().toggleLike('1')

      expect(useCommunityStore.getState().selectedPost?.is_liked).toBe(true)
      expect(useCommunityStore.getState().selectedPost?.like_count).toBe(1)
    })
  })

  describe('fetchPost', () => {
    it('loads post detail and comments', async () => {
      const mockPost = { id: '1', title: 'Detail Post' }
      const mockComments = [{ id: 'c1', content: 'Hello' }]
      vi.mocked(communityApi.getPost).mockResolvedValue({
        data: { post: mockPost, comments: mockComments },
      } as never)

      await useCommunityStore.getState().fetchPost('1')

      expect(useCommunityStore.getState().selectedPost).toEqual(mockPost)
      expect(useCommunityStore.getState().comments).toEqual(mockComments)
      expect(useCommunityStore.getState().isDetailLoading).toBe(false)
    })
  })

  describe('addComment', () => {
    it('appends comment and increments count', async () => {
      useCommunityStore.setState({
        posts: [{ id: '1', comment_count: 2 } as never],
        selectedPost: { id: '1', comment_count: 2 } as never,
        comments: [{ id: 'c1' } as never],
      })
      const newComment = { id: 'c2', content: 'New comment' }
      vi.mocked(communityApi.addComment).mockResolvedValue({
        data: newComment,
      } as never)

      await useCommunityStore.getState().addComment('1', 'New comment')

      expect(useCommunityStore.getState().comments).toHaveLength(2)
      expect(useCommunityStore.getState().selectedPost?.comment_count).toBe(3)
      expect(useCommunityStore.getState().posts[0].comment_count).toBe(3)
    })
  })

  describe('deletePost', () => {
    it('removes post from list', async () => {
      useCommunityStore.setState({
        posts: [
          { id: '1' } as never,
          { id: '2' } as never,
        ],
        total: 2,
      })
      vi.mocked(communityApi.deletePost).mockResolvedValue({} as never)

      await useCommunityStore.getState().deletePost('1')

      expect(useCommunityStore.getState().posts).toHaveLength(1)
      expect(useCommunityStore.getState().posts[0].id).toBe('2')
      expect(useCommunityStore.getState().total).toBe(1)
    })
  })

  describe('createPost', () => {
    it('closes dialog and refreshes list', async () => {
      useCommunityStore.setState({ isCreateDialogOpen: true })
      vi.mocked(communityApi.createPost).mockResolvedValue({
        data: { id: 'new' },
      } as never)
      vi.mocked(communityApi.listPosts).mockResolvedValue({
        data: { posts: [], total: 0, page: 1, limit: 20 },
      } as never)

      await useCommunityStore.getState().createPost({
        post_type: 'discussion',
        title: 'New Post',
        content: 'Content',
      })

      expect(useCommunityStore.getState().isCreateDialogOpen).toBe(false)
      expect(communityApi.listPosts).toHaveBeenCalled()
    })
  })

  describe('fetchTrending', () => {
    it('loads trending tags', async () => {
      const mockTags = [{ tag: 'health', count: 10 }, { tag: 'diet', count: 5 }]
      vi.mocked(communityApi.getTrending).mockResolvedValue({
        data: mockTags,
      } as never)

      await useCommunityStore.getState().fetchTrending()

      expect(useCommunityStore.getState().trendingTags).toEqual(mockTags)
    })

    it('silently handles errors', async () => {
      vi.mocked(communityApi.getTrending).mockRejectedValue(new Error('fail'))
      await useCommunityStore.getState().fetchTrending()
      expect(useCommunityStore.getState().trendingTags).toEqual([])
    })
  })

  describe('filter actions', () => {
    beforeEach(() => {
      vi.mocked(communityApi.listPosts).mockResolvedValue({
        data: { posts: [], total: 0, page: 1, limit: 20 },
      } as never)
    })

    it('setActiveTab resets page and fetches', async () => {
      useCommunityStore.setState({ page: 3 })
      useCommunityStore.getState().setActiveTab('research')

      expect(useCommunityStore.getState().activeTab).toBe('research')
      expect(useCommunityStore.getState().page).toBe(1)
      expect(communityApi.listPosts).toHaveBeenCalled()
    })

    it('setActiveTag resets page and fetches', async () => {
      useCommunityStore.setState({ page: 2 })
      useCommunityStore.getState().setActiveTag('diabetes')

      expect(useCommunityStore.getState().activeTag).toBe('diabetes')
      expect(useCommunityStore.getState().page).toBe(1)
    })

    it('setSortBy resets page and fetches', async () => {
      useCommunityStore.getState().setSortBy('popular')

      expect(useCommunityStore.getState().sortBy).toBe('popular')
      expect(useCommunityStore.getState().page).toBe(1)
    })
  })

  describe('setCreateDialogOpen', () => {
    it('toggles dialog state', () => {
      useCommunityStore.getState().setCreateDialogOpen(true)
      expect(useCommunityStore.getState().isCreateDialogOpen).toBe(true)

      useCommunityStore.getState().setCreateDialogOpen(false)
      expect(useCommunityStore.getState().isCreateDialogOpen).toBe(false)
    })
  })
})
