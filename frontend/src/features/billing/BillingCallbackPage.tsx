import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBillingStore } from '@/stores/billingStore'
import { billingApi } from '@/api/client'

const REDIRECT_SECONDS = 10

export default function BillingCallbackPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { pollOrderStatus } = useBillingStore()

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'cancelled' | 'timeout'>('verifying')
  const [paidPlan, setPaidPlan] = useState<string | null>(null)
  const [paidCycle, setPaidCycle] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  const orderId = searchParams.get('order_id')
  const cbToken = searchParams.get('cb_token')
  const outTradeNo = searchParams.get('out_trade_no')
  const cancelled = searchParams.get('cancelled')

  // Hard redirect to settings (full page refresh to load correct user data)
  const goToSettings = useCallback(() => {
    window.location.href = '/membership'
  }, [])

  // Try close tab; if browser blocks it, redirect to settings
  const closeOrRedirect = useCallback(() => {
    window.close()
    // window.close() is silently ignored for non-script-opened tabs
    // fallback: redirect after a short delay
    setTimeout(goToSettings, 300)
  }, [goToSettings])

  // Auto-redirect countdown after terminal states (success/failed/cancelled/timeout)
  useEffect(() => {
    if (status === 'verifying') return
    if (countdown <= 0) {
      goToSettings()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, countdown, goToSettings])

  // Payment verification
  useEffect(() => {
    if (cancelled === 'true') {
      setStatus('cancelled')
      return
    }

    let mounted = true

    const resolveOrderId = async (): Promise<string | null> => {
      if (orderId) return orderId
      if (outTradeNo) {
        try {
          const { data } = await billingApi.lookupOrderByProvider(outTradeNo)
          return data.order_id
        } catch {
          return null
        }
      }
      return null
    }

    const verify = async () => {
      try {
        const resolvedId = await resolveOrderId()
        if (!resolvedId) {
          if (mounted) navigate('/membership', { replace: true })
          return
        }

        const result = await pollOrderStatus(resolvedId, 60, cbToken || undefined)
        if (!mounted) return

        if (result.status === 'paid') {
          setStatus('success')
          setPaidPlan(result.plan || 'pro')
          setPaidCycle(result.billing_cycle || null)
        } else if (result.status === 'failed' || result.status === 'cancelled') {
          setStatus('failed')
        } else {
          setStatus('timeout')
        }
      } catch {
        if (mounted) setStatus('failed')
      }
    }

    void verify()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, outTradeNo, cancelled])

  const redirectHint = (
    <p className="text-xs text-slate-500 mt-3">
      {t('billing.auto_redirect', { seconds: countdown })}
    </p>
  )

  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-4">
              <svg className="animate-spin text-emerald-400" width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" strokeDasharray="70 30" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t('billing.verifying_payment')}</h2>
            <p className="text-sm text-slate-400">{t('billing.please_wait')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t('billing.payment_success')}</h2>
            {paidPlan === 'pro' && (
              <div className="mt-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('billing.your_plan')}</span>
                  <span className="text-emerald-400 font-semibold">
                    Pro{paidCycle ? ` · ${t(`billing.cycle_${paidCycle}`)}` : ''}
                  </span>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-400">{t('billing.close_tab_hint')}</p>
            <button
              onClick={closeOrRedirect}
              className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition"
            >
              {t('billing.back_to_settings')}
            </button>
            {redirectHint}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t('billing.payment_declined')}</h2>
            <p className="text-sm text-slate-400 mb-4">{t('billing.try_again_hint')}</p>
            <button
              onClick={closeOrRedirect}
              className="px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition"
            >
              {t('billing.back_to_settings')}
            </button>
            {redirectHint}
          </>
        )}

        {status === 'cancelled' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t('billing.payment_cancelled')}</h2>
            <p className="text-sm text-slate-400 mb-4">{t('billing.cancelled_hint')}</p>
            <button
              onClick={closeOrRedirect}
              className="px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition"
            >
              {t('billing.back_to_settings')}
            </button>
            {redirectHint}
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t('billing.payment_timeout')}</h2>
            <p className="text-sm text-slate-400 mb-4">{t('billing.timeout_hint')}</p>
            <button
              onClick={closeOrRedirect}
              className="px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition"
            >
              {t('billing.back_to_settings')}
            </button>
            {redirectHint}
          </>
        )}
      </div>
    </div>
  )
}
