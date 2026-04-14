import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { HeartIcon, MsgIcon } from '@/components/Icons'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import type { Comment } from '@/types/api'

function timeAgo(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return t('community.time_minutes_ago', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('community.time_hours_ago', { count: hrs })
  const days = Math.floor(hrs / 24)
  return t('community.time_days_ago', { count: days })
}

function CommentThread({ comment, allComments, postId, depth = 0 }: {
  comment: Comment
  allComments: Comment[]
  postId: string
  depth?: number
}) {
  const { t } = useTranslation()
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const { addComment } = useCommunityStore()
  const children = allComments.filter((c) => c.parent_id === comment.id)

  const handleReply = async () => {
    if (!replyContent.trim()) return
    await addComment(postId, replyContent.trim(), comment.id)
    setReplyContent('')
    setShowReply(false)
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-white/[0.06] pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center flex-shrink-0">
            {comment.user_avatar ? (
              <img src={comment.user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <span className="text-white text-[10px] font-bold">{comment.user_display_name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <span className="text-[12px] font-semibold text-white">{comment.user_display_name}</span>
          <span className="text-[11px] text-slate-500">· {timeAgo(comment.created_at, t)}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed ml-9">{comment.content}</p>
        <button
          onClick={() => setShowReply(!showReply)}
          className="ml-9 mt-1.5 text-[11px] text-slate-500 hover:text-emerald-400 transition"
        >
          {t('community.reply')}
        </button>

        {showReply && (
          <div className="ml-9 mt-2 flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReply() }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/40"
              placeholder={t('community.write_comment')}
            />
            <button
              onClick={handleReply}
              disabled={!replyContent.trim()}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-medium disabled:opacity-50"
            >
              {t('community.submit')}
            </button>
          </div>
        )}
      </div>

      {children.map((child) => (
        <CommentThread key={child.id} comment={child} allComments={allComments} postId={postId} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function PostDetailPage() {
  const { t } = useTranslation()
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { selectedPost, comments, isDetailLoading, fetchPost, toggleLike, addComment, deletePost } = useCommunityStore()
  const user = useAuthStore((s) => s.user)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (postId) fetchPost(postId)
  }, [postId, fetchPost])

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return
    await addComment(postId, newComment.trim())
    setNewComment('')
  }

  const handleDelete = async () => {
    if (!postId) return
    await deletePost(postId)
    navigate('/community')
  }

  if (isDetailLoading || !selectedPost) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <span className="text-slate-400">{t('common.loading')}</span>
      </div>
    )
  }

  const rootComments = comments.filter((c) => !c.parent_id)
  const isOwner = user?.id === selectedPost.user_id

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/community')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        {t('community.back_to_list')}
      </button>

      {/* Post */}
      <div className="max-w-3xl">
        <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center flex-shrink-0">
              {selectedPost.user_avatar ? (
                <img src={selectedPost.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">{selectedPost.user_display_name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="text-sm font-semibold text-white">{selectedPost.user_display_name}</span>
              <p className="text-[11px] text-slate-500">{timeAgo(selectedPost.created_at, t)}</p>
            </div>
            {selectedPost.post_type === 'research_share' && (
              <span className="ml-auto text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-medium">
                {t('community.research_label')}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-white mb-3">{selectedPost.title}</h1>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>

          {selectedPost.source && (
            <p className="mt-3 text-[11px] text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full inline-block font-medium">
              {selectedPost.source}
            </p>
          )}

          {selectedPost.tags && selectedPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-medium bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  # {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/[0.06]">
            <button onClick={() => toggleLike(selectedPost.id)} className={`flex items-center gap-1.5 transition ${selectedPost.is_liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}>
              <HeartIcon filled={selectedPost.is_liked} /><span className="text-[12px]">{selectedPost.like_count}</span>
            </button>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MsgIcon /><span className="text-[12px]">{selectedPost.comment_count} {t('community.replies')}</span>
            </div>
            {isOwner && (
              <button onClick={handleDelete} className="ml-auto text-[12px] text-slate-500 hover:text-red-400 transition">
                {t('community.delete')}
              </button>
            )}
          </div>
        </div>

        {/* Comment input */}
        <div className="mt-6 flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/40"
            placeholder={t('community.write_comment')}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {t('community.submit')}
          </button>
        </div>

        {/* Comments */}
        <div className="mt-6 space-y-1">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => (
              <CommentThread key={comment.id} comment={comment} allComments={comments} postId={selectedPost.id} />
            ))
          ) : (
            <p className="text-center text-slate-500 text-sm py-8">{t('community.no_comments')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
