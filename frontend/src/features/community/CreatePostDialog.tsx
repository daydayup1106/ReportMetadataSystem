import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCommunityStore } from '@/stores/communityStore'

export default function CreatePostDialog() {
  const { t } = useTranslation()
  const { isCreateDialogOpen, setCreateDialogOpen, createPost } = useCommunityStore()
  const [postType, setPostType] = useState<'discussion' | 'research_share'>('discussion')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isCreateDialogOpen) return null

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return
    setIsSubmitting(true)
    try {
      await createPost({
        post_type: postType,
        title: title.trim(),
        content: content.trim(),
        source: postType === 'research_share' && source.trim() ? source.trim() : undefined,
        tags: tags.length > 0 ? tags : undefined,
      })
      // Reset form
      setTitle('')
      setContent('')
      setSource('')
      setTags([])
      setPostType('discussion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setCreateDialogOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/[0.08] p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">{t('community.create_post')}</h2>

        {/* Post type selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPostType('discussion')}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium border transition ${
              postType === 'discussion'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
            }`}
          >
            {t('community.discussion_label')}
          </button>
          <button
            onClick={() => setPostType('research_share')}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium border transition ${
              postType === 'research_share'
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
            }`}
          >
            {t('community.research_label')}
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-[12px] text-slate-400 mb-1.5">{t('community.title_label')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/40"
            placeholder={t('community.title_label')}
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-[12px] text-slate-400 mb-1.5">{t('community.content_label')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/40 resize-none"
            placeholder={t('community.content_label')}
          />
        </div>

        {/* Source (for research) */}
        {postType === 'research_share' && (
          <div className="mb-4">
            <label className="block text-[12px] text-slate-400 mb-1.5">{t('community.source_label')}</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/40"
              placeholder={t('community.source_placeholder')}
            />
          </div>
        )}

        {/* Tags */}
        <div className="mb-5">
          <label className="block text-[12px] text-slate-400 mb-1.5">{t('community.tags_label')}</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
              maxLength={50}
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/40"
              placeholder={t('community.tags_label')}
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 5}
              className="px-3 py-2 rounded-lg bg-white/[0.06] text-slate-300 text-sm hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 text-emerald-400 hover:text-red-400">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setCreateDialogOpen(false)}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition"
          >
            {t('community.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
            className="px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('common.loading') : t('community.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
