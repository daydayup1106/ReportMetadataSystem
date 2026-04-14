import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { feedbackApi } from '@/api/client'
import { HelpIcon, MailIcon } from '@/components/Icons'

export default function HelpPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'general'>('general')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFeedbackSubmit = async () => {
    if (feedbackContent.trim().length < 10) return
    setFeedbackSubmitting(true)
    setFeedbackMessage(null)
    try {
      await feedbackApi.submit({
        category: feedbackCategory,
        content: feedbackContent.trim(),
        contact_email: user?.email ?? undefined,
      })
      setFeedbackMessage({ type: 'success', text: t('feedback.submitted') })
      setFeedbackContent('')
      setFeedbackCategory('general')
      setTimeout(() => setFeedbackMessage(null), 4000)
    } catch {
      setFeedbackMessage({ type: 'error', text: t('feedback.submit_failed') })
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
          <HelpIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('feedback.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl">
        <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          {/* Quick Links */}
          <div className="space-y-3 mb-6">
            <a
              href="mailto:luoyu1106@163.com"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition"
            >
              <span className="text-slate-400"><MailIcon /></span>
              <div>
                <p className="text-sm text-white font-medium">{t('feedback.contact_email')}</p>
                <p className="text-[12px] text-slate-500">luoyu1106@163.com</p>
              </div>
            </a>
            <div className="flex gap-3">
              <Link
                to="/billing/service-agreement"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition text-center"
              >
                {t('feedback.service_agreement')}
              </Link>
              <Link
                to="/billing/privacy-policy"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition text-center"
              >
                {t('feedback.privacy_policy')}
              </Link>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="border-t border-white/[0.06] pt-5">
            <h3 className="text-sm font-semibold text-white mb-4">{t('feedback.send_feedback')}</h3>

            {/* Category Selector */}
            <div className="flex gap-2 mb-4">
              {(['general', 'bug', 'feature'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFeedbackCategory(cat)}
                  className={`flex-1 px-3 py-2 rounded-xl text-[13px] font-medium border transition ${
                    feedbackCategory === cat
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]'
                  }`}
                >
                  {t(`feedback.category_${cat}`)}
                </button>
              ))}
            </div>

            {/* Text Area */}
            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder={t('feedback.placeholder')}
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition resize-none"
            />
            <div className="flex items-center justify-between mt-1 mb-4">
              <span className="text-[11px] text-slate-600">{t('feedback.min_chars')}</span>
              <span className="text-[11px] text-slate-600">{feedbackContent.length}/2000</span>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackSubmitting || feedbackContent.trim().length < 10}
                className="px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {feedbackSubmitting ? t('feedback.submitting') : t('feedback.submit')}
              </button>
              {feedbackMessage && (
                <p className={`text-sm font-medium ${
                  feedbackMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {feedbackMessage.text}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
