import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, HeartIcon, MsgIcon, ShareIcon, RightIcon } from '@/components/Icons'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import CreatePostDialog from './CreatePostDialog'

function timeAgo(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return t('community.time_minutes_ago', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('community.time_hours_ago', { count: hrs })
  const days = Math.floor(hrs / 24)
  return t('community.time_days_ago', { count: days })
}

export default function CommunityPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const {
    posts, total, page, isLoading,
    activeTab, sortBy, activeTag,
    trendingTags,
    setActiveTab, setSortBy, setActiveTag,
    fetchPosts, fetchTrending,
    toggleLike, setCreateDialogOpen,
  } = useCommunityStore()

  useEffect(() => {
    fetchPosts(1)
    fetchTrending()
  }, [fetchPosts, fetchTrending])

  const tabs = [
    { key: 'all' as const, label: t('community.following') },
    { key: 'research' as const, label: t('community.research') },
    { key: 'discussions' as const, label: t('community.discussions') },
  ]

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">{t('community.title')}</h1>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition"
        >
          <PlusIcon /> {t('community.new_post')}
        </button>
      </div>

      {/* Tabs + Sort */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-[12px] font-medium border transition ${
                activeTab === tab.key
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('latest')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
              sortBy === 'latest' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('community.sort_latest')}
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
              sortBy === 'popular' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('community.sort_popular')}
          </button>
        </div>
      </div>

      {/* Active tag filter */}
      {activeTag && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px] text-slate-400">{t('community.filtering_by')}:</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20">
            # {activeTag}
            <button onClick={() => setActiveTag(null)} className="ml-0.5 text-emerald-400 hover:text-red-400">&times;</button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-slate-400">{t('common.loading')}</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-slate-500 text-sm">{t('community.no_posts')}</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition cursor-pointer"
                  onClick={() => navigate(`/community/${post.id}`)}
                >
                  {/* Author row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center flex-shrink-0">
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-[11px] font-bold">{post.user_display_name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{post.user_display_name}</span>
                      <span className="text-[11px] text-slate-500">· {timeAgo(post.created_at, t)}</span>
                    </div>
                    {post.post_type === 'research_share' && post.source && (
                      <span className="ml-auto text-[11px] text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full font-medium">{post.source}</span>
                    )}
                  </div>

                  {/* Title + Content */}
                  <p className="text-sm font-bold text-white leading-snug mb-1">{post.title}</p>
                  <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">{post.content}</p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); setActiveTag(tag) }}
                          className="text-[10px] font-medium bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                        >
                          # {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-5 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(post.id) }}
                      className={`flex items-center gap-1.5 transition ${post.is_liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                    >
                      <HeartIcon filled={post.is_liked} /><span className="text-[11px]">{post.like_count}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-400 transition">
                      <MsgIcon /><span className="text-[11px]">{post.comment_count} {t('community.replies')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 hover:text-blue-400 transition">
                      <ShareIcon /><span className="text-[11px]">{t('community.share')}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {total > 20 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).slice(0, 5).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchPosts(p)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-medium transition ${
                        p === page ? 'bg-emerald-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* User conditions */}
          {user?.conditions && user.conditions.length > 0 && (
            <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[12px] text-emerald-400 font-semibold mb-3">{t('community.your_conditions')}</p>
              <div className="flex gap-2 flex-wrap">
                {user.conditions.map((c) => (
                  <span key={c} className="text-[11px] font-medium bg-emerald-500/10 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-500/20">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm font-bold text-white mb-3">{t('community.trending_topics')}</p>
            <div className="space-y-2.5">
              {trendingTags.length > 0 ? (
                trendingTags.map((item) => (
                  <div
                    key={item.tag}
                    onClick={() => setActiveTag(item.tag)}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <span className="text-[12px] text-slate-400 group-hover:text-emerald-300 transition"># {item.tag}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600">{item.count}</span>
                      <RightIcon />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate-500">{t('community.no_trending')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreatePostDialog />
    </div>
  )
}
