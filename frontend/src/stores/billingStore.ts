import { create } from 'zustand'
import type {
  BillingStatus,
  OrderResponse,
  PricingInfo,
  QuotaStatus,
  SubscriptionStatus,
} from '@/types/api'
import { billingApi } from '@/api/client'

interface BillingState {
  // Subscription & quota
  subscription: SubscriptionStatus | null
  quota: QuotaStatus | null
  pricing: PricingInfo | null
  isPro: boolean
  isLoading: boolean

  // Current payment flow
  currentOrder: OrderResponse | null
  orderPolling: boolean

  // Actions
  fetchStatus: () => Promise<void>
  fetchPricing: () => Promise<void>
  createOrder: (provider: string, billingCycle: string, platform?: string, agreementAccepted?: boolean) => Promise<OrderResponse>
  pollOrderStatus: (orderId: string, maxAttempts?: number, cbToken?: string) => Promise<{ status: string; plan?: string; billing_cycle?: string }>
  cancelSubscription: () => Promise<void>
  claimTrial: (agreementAccepted?: boolean) => Promise<void>
  // TODO: uncomment when Alipay agreement signing is implemented
  // toggleAutoRenew: (enabled: boolean) => Promise<void>
  clearOrder: () => void
}

function deriveIsPro(sub: SubscriptionStatus | null): boolean {
  if (!sub) return false
  return sub.plan === 'pro' && ['active', 'trialing', 'past_due'].includes(sub.status)
}

export const useBillingStore = create<BillingState>((set, get) => ({
  subscription: null,
  quota: null,
  pricing: null,
  isPro: false,
  isLoading: false,
  currentOrder: null,
  orderPolling: false,

  fetchStatus: async () => {
    set({ isLoading: true })
    try {
      const { data } = await billingApi.getStatus()
      set({
        subscription: data.subscription,
        quota: data.quota,
        isPro: deriveIsPro(data.subscription),
      })
    } catch {
      // On error, default to free
      set({ isPro: false })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPricing: async () => {
    try {
      const { data } = await billingApi.getPricing()
      set({ pricing: data })
    } catch {
      // Pricing fetch failure is non-critical
    }
  },

  createOrder: async (provider, billingCycle, platform, agreementAccepted) => {
    const { data } = await billingApi.subscribe({
      provider,
      billing_cycle: billingCycle,
      platform: platform || (window.innerWidth < 768 ? 'mobile' : 'pc'),
      agreement_accepted: agreementAccepted ?? false,
    })
    set({ currentOrder: data })
    return data
  },

  pollOrderStatus: async (orderId, maxAttempts = 100, cbToken?: string) => {
    set({ orderPolling: true })
    let attempts = 0
    try {
      while (attempts < maxAttempts) {
        attempts++
        const queryProvider = attempts > 5
        try {
          // Use public endpoint (no auth needed) when cbToken is available
          const { data } = cbToken
            ? await billingApi.verifyOrderPublic(orderId, cbToken, queryProvider)
            : await billingApi.verifyOrder(orderId, queryProvider)
          if (data.status === 'paid') {
            // Only refresh billing state when using authenticated endpoint (correct user)
            if (!cbToken) await get().fetchStatus()
            set({ orderPolling: false, currentOrder: null })
            return { status: 'paid', plan: data.plan, billing_cycle: data.billing_cycle }
          }
          if (data.status === 'failed' || data.status === 'cancelled') {
            set({ orderPolling: false })
            return { status: data.status }
          }
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status
          console.error(`[pollOrder] #${attempts} API error: status=${status}`, err)
          if (status === 404) {
            console.error('[pollOrder] 404 — stopping.')
            set({ orderPolling: false })
            return { status: 'error' }
          }
        }
        await new Promise((r) => setTimeout(r, 3000))
      }
      set({ orderPolling: false })
      return { status: 'timeout' }
    } catch (err) {
      console.error('[pollOrder] Unexpected error:', err)
      set({ orderPolling: false })
      return { status: 'error' }
    }
  },

  cancelSubscription: async () => {
    const { data } = await billingApi.cancel()
    set({
      subscription: data,
      isPro: deriveIsPro(data),
    })
  },

  claimTrial: async (agreementAccepted) => {
    const { data } = await billingApi.claimTrial({ agreement_accepted: agreementAccepted ?? false })
    set({
      subscription: data,
      isPro: deriveIsPro(data),
    })
  },

  // TODO: uncomment when Alipay agreement signing is implemented
  // toggleAutoRenew: async (enabled) => {
  //   const { data } = await billingApi.toggleAutoRenew(enabled)
  //   set({
  //     subscription: data,
  //     isPro: deriveIsPro(data),
  //   })
  // },

  clearOrder: () => set({ currentOrder: null, orderPolling: false }),
}))
